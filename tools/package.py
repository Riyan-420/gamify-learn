#!/usr/bin/env python3
"""Build dist/gamify-learn.skill (a zip with a top-level gamify-learn/ folder) for upload or manual install."""
import os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "skills", "gamify-learn")
OUT = os.path.join(ROOT, "dist", "gamify-learn.skill")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
n = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for r, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for f in sorted(files):
            if f.endswith(".pyc"):
                continue
            p = os.path.join(r, f)
            z.write(p, os.path.join("gamify-learn", os.path.relpath(p, SRC)).replace("\\", "/"))
            n += 1
print(f"wrote {OUT}  ({n} files, {os.path.getsize(OUT) // 1024} KB)")
