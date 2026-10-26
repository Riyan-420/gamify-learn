#!/usr/bin/env python3
"""Pre-check every formula of a course with the same KaTeX the game ships, before the learner ever sees a red error box.

usage: python math_check.py course.json
Needs Node.js (only for this check; the game itself needs nothing). validate.py and build.py call check() automatically
when `node` is on the PATH and skip it quietly when it is not.

It reports: a formula KaTeX cannot parse (with the exact reason and where it is), and a graph/lab expression that is not valid
JavaScript or never produces a number in its range.
"""
import json, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
INLINE = re.compile(r"\$\$([\s\S]+?)\$\$|\$(?!\s)([^$\n]*?[^\s$])\$(?!\d)")   # same rule as the game: "$1,000 and $2,000" is money, not maths
# keys whose text is not drawn through the maths layer (or is not text at all)
SKIP = {"svg", "viz", "code", "images", "src", "id", "ids", "type", "teaches", "needs", "credit", "alt", "source", "fmt", "unit", "slug", "theme", "lang"}


def collect(o, loc, tex, expr):
    if isinstance(o, str):
        if "$" in o:
            for m in INLINE.finditer(o.replace("\\$", " ")):
                d = m.group(1) is not None
                tex.append({"loc": loc, "tex": (m.group(1) if d else m.group(2)), "display": d})
        return
    if isinstance(o, list):
        for i, v in enumerate(o):
            collect(v, f"{loc}[{i + 1}]", tex, expr)
        return
    if not isinstance(o, dict):
        return
    t = o.get("type")
    if t == "decode" and o.get("tex"):
        tex.append({"loc": loc + ".tex", "tex": o["tex"], "display": True})
    if t == "graph":
        par = o.get("params") or {}
        names = ["x"] + list(par)
        for i, f in enumerate(o.get("functions", []), 1):
            if f.get("expr"):
                expr.append({"loc": f"{loc}.functions[{i}]", "expr": f["expr"], "names": names, "lo": o["x"][0], "hi": o["x"][1], "vals": par})
    if t == "lab":
        names = [c.get("id") for c in o.get("controls", []) if c.get("id")]
        vals = {c["id"]: c.get("value", c.get("min", 1)) for c in o.get("controls", []) if c.get("id")}
        for i, ou in enumerate(o.get("outputs", []), 1):
            if ou.get("expr") and names:
                expr.append({"loc": f"{loc}.outputs[{i}]", "expr": ou["expr"], "names": names, "lo": vals[names[0]], "hi": vals[names[0]] + 1e-9, "vals": vals})
        pl = o.get("plot") or {}
        for i, se in enumerate(pl.get("series", []), 1):
            if se.get("expr") and pl.get("x"):
                expr.append({"loc": f"{loc}.plot.series[{i}]", "expr": se["expr"], "names": ["x"] + names, "lo": pl["x"][0], "hi": pl["x"][1], "vals": vals})
    for k, v in o.items():
        if k in SKIP or k in ("expr", "tex") or (t == "graph" and k in ("functions",)):
            continue
        collect(v, f"{loc}.{k}" if loc else k, tex, expr)


def check(course):
    """Return (errors, note). `note` is a message when the check could not run (no Node.js), else ''."""
    node = shutil.which("node")
    if not node:
        return [], "node not found: formulas were not pre-checked in KaTeX (install Node.js to catch broken formulas at build time)"
    tex, expr = [], []
    for qi, q in enumerate(course.get("quests", []), 1):
        for si, s in enumerate(q.get("steps", []), 1):
            collect(s, f"quest {qi} step {si} ({s.get('type', '?')})", tex, expr)
        for key in ("quiz", "cards", "recap"):
            collect(q.get(key), f"quest {qi} {key}", tex, expr)
        for key in ("title", "question", "outcomes", "previously", "next_hook"):
            collect(q.get(key), f"quest {qi} {key}", tex, expr)
    collect(course.get("glossary"), "glossary", tex, expr)
    if not tex and not expr:
        return [], ""
    try:
        r = subprocess.run([node, os.path.join(HERE, "math_check.js")], input=json.dumps({"tex": tex, "expr": expr}), capture_output=True, text=True, encoding="utf-8", timeout=60)
        if r.returncode != 0:
            return [], "formula pre-check could not run: " + (r.stderr.strip().splitlines() or ["node failed"])[-1][:120]
        bad = json.loads(r.stdout or "[]")
    except Exception as ex:   # never block a build because the checker itself broke
        return [], f"formula pre-check could not run: {ex}"
    errs = []
    for b in bad:
        if b["kind"] == "tex":
            errs.append(f"{b['loc']}: formula does not render ({b['error']}) in: {b['tex']}")
        else:
            errs.append(f"{b['loc']}: expression '{b['tex']}' {b['error']}")
    return errs, ""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        course = json.load(f)
    e, note = check(course)
    if note:
        print("note :", note)
    for x in e:
        print("ERROR:", x)
    print(f"{len(e)} formula/expression problem(s)")
    sys.exit(1 if e else 0)
