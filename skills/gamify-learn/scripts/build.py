#!/usr/bin/env python3
"""Build a single self-contained HTML game from a course.json.

usage: python build.py course.json [-o out.html] [--no-validate]

Images referenced by relative path (figure steps: "src", or <img src="..."> inside html/viz strings)
are inlined as base64 so the output is one file that works offline.
"""
import argparse, base64, json, mimetypes, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(os.path.dirname(HERE), "assets")
MAX_IMG = 1_500_000  # bytes per image; bigger ones are skipped with a warning


def read(*p):
    with open(os.path.join(ASSETS, *p), encoding="utf-8") as f:
        return f.read()


def b64(*p):
    with open(os.path.join(ASSETS, *p), "rb") as f:
        return base64.b64encode(f.read()).decode()


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    size = os.path.getsize(path)
    if size > MAX_IMG:
        print(f"  warning: {os.path.basename(path)} is {size // 1024} KB (> {MAX_IMG // 1024} KB); shrink it or the file gets heavy")
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def inline_images(node, base):
    """Walk the JSON; replace relative image paths with data URIs."""
    pat = re.compile(r'(<img[^>]*?\ssrc=)(["\'])(?!data:|https?:|//)([^"\']+)\2')

    def fix_html(s):
        def rep(m):
            p = os.path.join(base, m.group(3))
            if os.path.isfile(p):
                return f'{m.group(1)}"{data_uri(p)}"'
            print(f"  warning: image not found: {m.group(3)}")
            return m.group(0)
        return pat.sub(rep, s)

    if isinstance(node, dict):
        for k, v in list(node.items()):
            if k == "src" and isinstance(v, str) and not re.match(r"(data:|https?:|//)", v):
                p = os.path.join(base, v)
                if os.path.isfile(p):
                    node[k] = data_uri(p)
                else:
                    print(f"  warning: image not found: {v}")
            elif isinstance(v, str):
                node[k] = fix_html(v) if "<img" in v else v
            else:
                inline_images(v, base)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str):
                node[i] = fix_html(v) if "<img" in v else v
            else:
                inline_images(v, base)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("course")
    ap.add_argument("-o", "--out")
    ap.add_argument("--no-validate", action="store_true")
    ap.add_argument("--strict", action="store_true", help="treat validation warnings as errors")
    a = ap.parse_args()

    course_path = os.path.abspath(a.course)
    with open(course_path, encoding="utf-8") as f:
        course = json.load(f)

    if not a.no_validate:
        sys.path.insert(0, HERE)
        import validate
        errs, warns = validate.check(course, os.path.dirname(course_path))
        for w in warns:
            print("  warn :", w)
        for e in errs:
            print("  ERROR:", e)
        if errs or (a.strict and warns):
            print(f"{len(errs)} error(s), {len(warns) if a.strict else 0} warning(s) counted as errors. Fix them or pass --no-validate.")
            sys.exit(1)

    inline_images(course, os.path.dirname(course_path))
    out = a.out or os.path.splitext(course_path)[0] + ".html"

    cj = json.dumps(course, ensure_ascii=False).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    page = (read("engine", "template.html")
            .replace("{{LANG}}", course.get("lang", "en"))
            .replace("{{TITLE}}", re.sub(r"<[^>]+>", "", course["title"]).replace("&", "&amp;"))
            .replace("{{FONT_PX}}", b64("fonts", "PressStart2P-latin.woff2"))
            .replace("{{FONT_VT}}", b64("fonts", "VT323-latin.woff2"))
            .replace("{{CSS}}", read("engine", "engine.css"))
            .replace("{{COURSE_JSON}}", cj)
            .replace("{{JS}}", read("engine", "engine.js")))
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    nq = sum(len(q.get("quiz", [])) for q in course["quests"])
    nc = sum(len(q.get("cards", [])) for q in course["quests"])
    print(f"built {out}  ({len(page) // 1024} KB, {len(course['quests'])} quests, {nq} quiz questions, {nc} cards)")


if __name__ == "__main__":
    main()
