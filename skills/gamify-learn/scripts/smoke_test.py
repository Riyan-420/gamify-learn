#!/usr/bin/env python3
"""Headless-browser self-test: renders every screen of a built game and reports exceptions.

usage: python smoke_test.py game.html
Needs Chrome, Chromium or Edge installed. Exit code 1 on failure, 2 if no browser was found.
"""
import os, re, shutil, subprocess, sys, tempfile


def find_browser():
    cands = [shutil.which(n) for n in ("google-chrome", "chrome", "chromium", "chromium-browser", "msedge", "microsoft-edge")]
    cands += [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ]
    for c in cands:
        if c and os.path.exists(c):
            return c
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = os.path.abspath(sys.argv[1])
    exe = find_browser()
    if not exe:
        print("No Chrome/Chromium/Edge found; open the HTML with ?selftest in a browser and read the <pre id=selftest> line.")
        sys.exit(2)
    prof = tempfile.mkdtemp(prefix="gl-smoke-")
    url = "file:///" + path.replace("\\", "/").lstrip("/") + "?selftest"
    cmd = [exe, "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={prof}", "--virtual-time-budget=6000", "--dump-dom", url]
    try:
        out = subprocess.run(cmd, capture_output=True, timeout=90).stdout.decode("utf-8", "replace")
    finally:
        shutil.rmtree(prof, ignore_errors=True)
    m = re.search(r'<pre id="selftest">(.*?)</pre>', out, re.S)
    if not m:
        print("FAIL: self-test line not found (the page probably threw before rendering)")
        sys.exit(1)
    msg = re.sub(r"&lt;", "<", re.sub(r"&gt;", ">", re.sub(r"&amp;", "&", m.group(1))))
    print(msg)
    sys.exit(0 if msg.startswith("OK") else 1)


if __name__ == "__main__":
    main()
