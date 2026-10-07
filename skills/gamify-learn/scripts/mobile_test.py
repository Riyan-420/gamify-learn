#!/usr/bin/env python3
"""Phone-emulation test for a built gamify-learn game (optional; needs `pip install websocket-client` and Chrome/Edge).

usage: python mobile_test.py game.html [--w 390] [--h 844] [--shots out_dir] [--only q7/9,map]
Emulates a phone (touch, device pixel ratio 3, mobile user agent), visits every screen with ?reveal and reports
screens where the page becomes wider than the screen (the sideways-scroll / zoomed-out bug). 390 = iPhone 14/15,
360 = common Android, 320 = iPhone SE. This is emulation, not a real device."""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request, shutil, re
import websocket

args = sys.argv[1:]
game = os.path.abspath(args[0])
W = int(args[args.index("--w") + 1]) if "--w" in args else 390
Hh = int(args[args.index("--h") + 1]) if "--h" in args else 844
shots = args[args.index("--shots") + 1] if "--shots" in args else None
only = args[args.index("--only") + 1].split(",") if "--only" in args else None
from smoke_test import find_browser
chrome = find_browser()
if not chrome:
    sys.exit("No Chrome/Chromium/Edge found")
port = 9333
prof = tempfile.mkdtemp(prefix="mt-")
p = subprocess.Popen([chrome, "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={prof}",
                      f"--remote-debugging-port={port}", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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

    def ev(js):
        r = cmd("Runtime.evaluate", expression=js, returnByValue=True, awaitPromise=True)
        return r.get("result", {}).get("value")

    cmd("Page.enable")
    cmd("Emulation.setDeviceMetricsOverride", width=W, height=Hh, deviceScaleFactor=3, mobile=True)
    cmd("Emulation.setTouchEmulationEnabled", enabled=True)
    cmd("Emulation.setUserAgentOverride", userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
    url = "file:///" + game.replace("\\", "/") + "?reveal"
    cmd("Page.navigate", url=url)
    time.sleep(2.5)
    # enumerate screens: quests and screen counts from the engine's data if exposed; else probe by stepping
    targets = ["map", "title"]
    cnt = ev("(typeof COURSE!=='undefined'&&COURSE.quests)?COURSE.quests.length:0") or 0
    if not cnt:
        cnt = ev("document.querySelectorAll('.qnode').length") or 13
    bad = []
    seen = 0
    # navigate by hash through each quest; use the position counter text 'a/b' to learn the length
    ctr = [0]
    def visit(t):
        ctr[0] += 1
        cmd("Page.navigate", url=url + f"&r={ctr[0]}#" + t)
        time.sleep(0.4)

    def screens_in_quest(q):
        visit(f"q{q}/1")
        txt = ev("(document.querySelector('.pos')||{}).textContent||''") or ""
        m = re.search(r"(\d+)\s*/\s*(\d+)", txt)
        return int(m.group(2)) if m else 0

    plan = []
    for t in ["map"]:
        plan.append(t)
    q = 1
    while q <= 40:
        n = screens_in_quest(q)
        if not n:
            break
        plan += [f"q{q}/{i}" for i in range(1, n + 1)]
        q += 1
    if only:
        plan = [t for t in plan if t in only]
    JS = """(()=>{const vw=document.documentElement.clientWidth;const sw=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
      const off=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&(r.right>vw+1||r.left<-1)){const cs=getComputedStyle(e);if(cs.position!=='fixed'&&!e.closest('svg')&&off.length<4)off.push(e.tagName.toLowerCase()+'.'+(e.className&&e.className.baseVal===undefined?e.className:'')+' '+Math.round(r.left)+'..'+Math.round(r.right))}});
      return {vw:vw,sw:sw,off:off}})()"""
    worst = 0
    for t in plan:
        visit(t)
        r = ev(JS) or {}
        seen += 1
        if r.get("sw", 0) > r.get("vw", 0) + 1:
            bad.append((t, r))
            worst = max(worst, r.get("sw", 0) - r.get("vw", 0))
        if shots:
            os.makedirs(shots, exist_ok=True)
            data = cmd("Page.captureScreenshot", format="png", captureBeyondViewport=False).get("data")
            if data:
                open(os.path.join(shots, t.replace("/", "_") + ".png"), "wb").write(base64.b64decode(data))
    print(f"viewport {W}x{Hh}: {seen} screens checked, {len(bad)} with horizontal overflow, worst +{worst}px")
    for t, r in bad[:25]:
        print(" ", t, r)
finally:
    try:
        p.kill()
    except Exception:
        pass
    shutil.rmtree(prof, ignore_errors=True)
