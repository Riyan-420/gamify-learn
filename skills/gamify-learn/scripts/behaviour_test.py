#!/usr/bin/env python3
"""Behaviour test for a built gamify-learn game (v1.4): resume, back-navigation, swipe safety.

usage: python behaviour_test.py game.html [--w 390] [--h 844]
Drives headless Chrome over the DevTools protocol with real touch events and checks:
  1. the place in a quest is saved and START / CONTINUE / START OVER appear on the map
  2. the title screen resumes the quest where you left it
  3. coming BACK shows the whole page (nothing to re-reveal) and does not gate NEXT again
  4. a deliberate horizontal swipe changes the screen; a pinch, a swipe on a code block, a zoomed-in swipe,
     a diagonal swipe and a swipe from the screen edge do NOT
Needs `pip install websocket-client` and Chrome/Edge. Uses port 9334 (never run two at once)."""
import json, os, subprocess, sys, tempfile, time, urllib.request
import websocket

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from smoke_test import find_browser

args = sys.argv[1:]
game = os.path.abspath(args[0])
W = int(args[args.index("--w") + 1]) if "--w" in args else 390
H = int(args[args.index("--h") + 1]) if "--h" in args else 844
chrome = find_browser()
if not chrome:
    sys.exit("No Chrome/Chromium/Edge found")
port = 9334
prof = tempfile.mkdtemp(prefix="bt-")
p = subprocess.Popen([chrome, "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={prof}",
                      f"--remote-debugging-port={port}", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
fails, passes = [], 0


def ok(cond, msg):
    global passes
    if cond:
        passes += 1
        print("  ok  ", msg)
    else:
        fails.append(msg)
        print("  FAIL", msg)


try:
    for _ in range(50):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
            if tabs:
                break
        except Exception:
            time.sleep(0.2)
    tab = [t for t in tabs if t["type"] == "page"][0]
    ws = websocket.create_connection(tab["webSocketDebuggerUrl"], timeout=30, suppress_origin=True)
    mid = [0]

    def cmd(method, **params):
        mid[0] += 1
        ws.send(json.dumps({"id": mid[0], "method": method, "params": params}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == mid[0]:
                return r.get("result", {})

    def js(expr):
        r = cmd("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        return r.get("result", {}).get("value")

    cmd("Page.enable")
    cmd("Emulation.setDeviceMetricsOverride", width=W, height=H, deviceScaleFactor=2, mobile=True)
    cmd("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
    url = "file:///" + game.replace("\\", "/")

    def load(hash_=""):
        cmd("Page.navigate", url="about:blank")      # a fragment-only navigation would not restart the game
        time.sleep(0.3)
        cmd("Page.navigate", url=url + hash_)
        time.sleep(1.2)

    def step():
        return js("(location.hash.match(/#q(\\d+)\\/(\\d+)/)||[]).slice(1).join('/')")

    def press(key="ArrowRight", n=1):
        for _ in range(n):
            js("document.dispatchEvent(new KeyboardEvent('keydown',{key:%s,bubbles:true}))" % json.dumps(key))
            time.sleep(0.08)

    def touch(kind, points):
        cmd("Input.dispatchTouchEvent", type=kind, touchPoints=points)

    def swipe(x0, y0, x1, y1, steps=6, ms=0.01):
        touch("touchStart", [{"x": x0, "y": y0, "id": 1}])
        for i in range(1, steps + 1):
            touch("touchMove", [{"x": x0 + (x1 - x0) * i / steps, "y": y0 + (y1 - y0) * i / steps, "id": 1}])
            time.sleep(ms)
        touch("touchEnd", [])
        time.sleep(0.15)

    def pinch():
        a0, b0 = {"x": 150, "y": 400, "id": 1}, {"x": 240, "y": 400, "id": 2}
        touch("touchStart", [a0])
        touch("touchStart", [a0, b0])
        for i in range(1, 6):
            touch("touchMove", [{"x": 150 - 12 * i, "y": 400, "id": 1}, {"x": 240 + 12 * i, "y": 400, "id": 2}])
        touch("touchEnd", [{"x": 90, "y": 400, "id": 1}])          # one finger lifts first
        touch("touchEnd", [])
        time.sleep(0.15)

    print("1. resume")
    load("")
    js("localStorage.clear()")
    load("#q1/1")
    press("ArrowRight", 6)
    s1 = step()
    ok(s1 and s1.split("/")[1] != "1", f"moved forward ({s1})")
    saved = js("Object.values(JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('gamify_learn_'))))).length>0")
    load("")                                           # reopen the file: no hash
    title = js("document.querySelector('#app .btn.big')?.textContent||''")
    ok(title.startswith("CONTINUE") and "step" in title, f"title offers a resume button ('{title.strip()[:40]}')")
    js("document.querySelector('#app [data-a=start]').click()")
    time.sleep(0.3)
    ok(step() == s1, f"CONTINUE returns to the same screen ({step()} vs {s1})")
    js("document.querySelector('.brand').click()")
    time.sleep(0.3)
    btns = js("[...document.querySelectorAll('.qc')[0].querySelectorAll('.btn')].map(b=>b.textContent.trim())")
    ok(btns and "CONTINUE" in btns[0] and "START OVER" in btns[-1], f"map card shows CONTINUE + START OVER ({btns})")
    js("document.querySelectorAll('.qc')[0].querySelector('.btn.ghost').click()")
    time.sleep(0.3)
    ok(step().endswith("/1"), f"START OVER goes to step 1 ({step()})")
    js("document.querySelector('.brand').click()")
    time.sleep(0.2)
    js("document.querySelectorAll('.qc')[0].click()")   # a tap on the card body must do nothing
    time.sleep(0.2)
    ok(js("location.hash") == "#map", "tapping the card body does not open the quest")

    print("2. back shows the whole page")
    load("")
    js("localStorage.clear()")              # section 1 saved progress, which would pre-reveal screens
    load("#q1/1")
    press("ArrowRight", 2)                              # past mission (+ warm-up on later quests)
    # find a step with several reveals by walking forward until one has .rv elements
    found = None
    for _ in range(14):
        n = js("document.querySelectorAll('#body .rv').length")
        if n and n >= 3:
            found = n
            break
        press("ArrowRight")
    ok(found, f"found a screen with {found} reveals")
    here = step()
    on0 = js("document.querySelectorAll('#body .rv.on').length")
    press("ArrowRight", 1)
    on1 = js("document.querySelectorAll('#body .rv.on').length")
    ok(on1 == on0 + 1, f"one press reveals one piece ({on0} -> {on1})")
    press("ArrowRight", found)                         # reveal the rest, then leave
    press("ArrowRight")
    ok(step() != here, "moved to the next screen")
    press("ArrowLeft")
    ok(step() == here, f"BACK returns to the screen ({step()})")
    total = js("document.querySelectorAll('#body .rv').length")
    shown = js("document.querySelectorAll('#body .rv.on').length")
    ok(total == shown, f"BACK shows the whole page at once ({shown}/{total})")
    nxt = js("document.querySelector('[data-n=next]').textContent.trim()")
    ok(nxt.startswith("NEXT") or nxt.startswith("MAP"), f"NEXT button is plain NEXT, nothing left to reveal ('{nxt[:4]}')")

    print("3. swipe safety (touch)")
    load("#q1/3")
    base = step()
    swipe(300, 420, 120, 424)                           # clear left swipe -> next
    ok(step() != base, f"deliberate swipe changes the screen ({base} -> {step()})")
    base = step()
    pinch()
    ok(step() == base, "pinch does not change the screen")
    swipe(300, 300, 190, 330)                           # short and diagonal
    ok(step() == base, "short diagonal drag does not change the screen")
    swipe(380, 420, 150, 424)                           # starts at the edge
    ok(step() == base, "swipe from the screen edge is ignored")
    swipe(300, 300, 120, 540)                           # mostly vertical (scroll)
    ok(step() == base, "vertical scroll does not change the screen")
    # sideways-scrolling block: inject a wide code block and swipe on it
    js("""(()=>{const pre=document.createElement('pre');pre.className='codeblock';pre.id='tcode';
      pre.innerHTML='<code>'+'x'.repeat(400)+'</code>';document.querySelector('#body').prepend(pre)})()""")
    r = js("(()=>{const r=document.getElementById('tcode').getBoundingClientRect();return [r.left+60,r.top+10]})()")
    swipe(r[0] + 150, r[1], r[0] - 50, r[1] + 2)
    ok(step() == base, "swipe on a wide code block scrolls the block, not the page")
    js("document.getElementById('tcode').remove()")
    # zoomed in: fake the visual viewport scale
    js("Object.defineProperty(window.visualViewport,'scale',{configurable:true,get:()=>2})")
    swipe(300, 420, 120, 424)
    ok(step() == base, "swipe while zoomed in is ignored")
    js("delete window.visualViewport.scale")
    # setting off
    js("""(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('gamify_learn_'));const s=JSON.parse(localStorage.getItem(k));s.swipe=false;localStorage.setItem(k,JSON.stringify(s))})()""")
    load("#q1/3")
    base = step()
    swipe(300, 420, 120, 424)
    ok(step() == base, "swipe does nothing when switched off in Menu")
finally:
    try:
        p.terminate()
    except Exception:
        pass

print(f"\n{passes} passed, {len(fails)} failed")
if fails:
    for f in fails:
        print("  -", f)
    sys.exit(1)
