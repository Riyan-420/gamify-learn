#!/usr/bin/env python3
"""Build a single self-contained HTML game from a course.json.

usage: python build.py course.json [-o out.html] [--theme retro|minimal|modern] [--no-validate]

Images referenced by relative path (figure steps: "src", or <img src="..."> inside html/viz strings)
are inlined as base64 so the output is one file that works offline.

Themes (see themes.py and references/themes.md): `--theme minimal` or `"theme": "minimal"` in course.json.
Default is retro. `pastel` is an alias of minimal.
"""
import argparse, base64, json, mimetypes, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import themes

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


KATEX_FONTS = ["KaTeX_Main-Regular", "KaTeX_Main-Bold", "KaTeX_Main-Italic", "KaTeX_Main-BoldItalic", "KaTeX_Math-Italic", "KaTeX_Math-BoldItalic", "KaTeX_AMS-Regular",
               "KaTeX_Size1-Regular", "KaTeX_Size2-Regular", "KaTeX_Size3-Regular", "KaTeX_Size4-Regular", "KaTeX_Caligraphic-Regular", "KaTeX_SansSerif-Regular", "KaTeX_Typewriter-Regular"]


MATH_RX = re.compile(r"\$\$[\s\S]+?\$\$|\$(?!\s)[^$\n]*?[^\s$]\$(?!\d)")   # same rule as the game: "$1,000 and $2,000" is money, not maths


def course_uses_math(o):
    """True if any text holds real $...$ maths or a decode step has a typeset formula (so KaTeX must be inlined)."""
    if isinstance(o, str):
        return bool(MATH_RX.search(o.replace("\\$", " ")))
    if isinstance(o, dict):
        if o.get("type") == "decode" and o.get("tex"):
            return True
        return any(course_uses_math(v) for k, v in o.items() if k not in ("svg", "viz", "code", "src", "images"))
    if isinstance(o, list):
        return any(course_uses_math(v) for v in o)
    return False


def katex_assets():
    """KaTeX (MIT licence) inlined with only the fonts a course needs, as woff2 data URIs. Returns (css_block, js_block)."""
    css = read("katex", "katex.min.css")
    css = re.sub(r"@font-face\{[^}]*\}", "", css)
    faces = []
    meta = {"Main-Regular": ("KaTeX_Main", 400, "normal"), "Main-Bold": ("KaTeX_Main", 700, "normal"), "Main-Italic": ("KaTeX_Main", 400, "italic"), "Main-BoldItalic": ("KaTeX_Main", 700, "italic"),
            "Math-Italic": ("KaTeX_Math", 400, "italic"), "Math-BoldItalic": ("KaTeX_Math", 700, "italic"), "AMS-Regular": ("KaTeX_AMS", 400, "normal"),
            "Size1-Regular": ("KaTeX_Size1", 400, "normal"), "Size2-Regular": ("KaTeX_Size2", 400, "normal"), "Size3-Regular": ("KaTeX_Size3", 400, "normal"), "Size4-Regular": ("KaTeX_Size4", 400, "normal"),
            "Caligraphic-Regular": ("KaTeX_Caligraphic", 400, "normal"), "SansSerif-Regular": ("KaTeX_SansSerif", 400, "normal"), "Typewriter-Regular": ("KaTeX_Typewriter", 400, "normal")}
    for key, (fam, w, st) in meta.items():
        faces.append("@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');font-weight:%s;font-style:%s}" % (fam, b64("katex", "fonts", "KaTeX_%s.woff2" % key), w, st))
    return "\n".join(faces) + "\n" + css, "<script>\n" + read("katex", "katex.min.js") + "\n</script>"


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
    ap.add_argument("--theme", choices=themes.names() + sorted(themes.ALIASES), help="look of the game (default: course.json \"theme\", else retro)")
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

    asked = a.theme or course.get("theme", "retro")
    theme = themes.resolve(asked)
    if not theme:
        print(f"unknown theme {asked!r}; choose one of: {', '.join(themes.names())}")
        sys.exit(1)
    if asked != theme:
        print(f"  note: theme {asked!r} is now called {theme!r}")
    tj = themes.load(theme)
    inline_images(course, os.path.dirname(course_path))
    course = themes.retheme(course, theme)
    out = a.out or os.path.splitext(course_path)[0] + ".html"
    uses_math = (course_uses_math(course) or bool(course.get("math"))) and course.get("math") is not False
    kcss, kjs = katex_assets() if uses_math else ("", "")

    cj = json.dumps(course, ensure_ascii=False).replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    if theme == "retro":
        fonts = ("@font-face{font-family:'Press Start 2P';src:url(data:font/woff2;base64," + b64("fonts", "PressStart2P-latin.woff2") + ") format('woff2');font-display:swap}\n"
                 "@font-face{font-family:'VT323';src:url(data:font/woff2;base64," + b64("fonts", "VT323-latin.woff2") + ") format('woff2');font-display:swap}")
        theme_css = theme_js = ""
        bg = '<div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>'
        floor = '<div class="floor"></div>'
    else:
        fonts = "\n".join(
            "@font-face{font-family:'%s';src:url(data:font/woff;base64,%s) format('woff');font-weight:%s;font-style:%s;font-display:swap}"
            % (f["family"], b64("fonts", f["file"]), f.get("weight", 400), f.get("style", "normal")) for f in tj.get("fonts", []))
        theme_css = read("themes", theme, "theme.css")
        theme_js = "<script>\n" + read("themes", theme, "theme.js") + "\n</script>"
        bg = tj.get("bg", "")
        floor = ""
    page = (read("engine", "template.html")
            .replace("{{LANG}}", course.get("lang", "en"))
            .replace("{{THEME_COLOR}}", tj["color"])
            .replace("{{THEME}}", theme)
            .replace("{{TITLE}}", re.sub(r"<[^>]+>", "", course["title"]).replace("&", "&amp;"))
            .replace("{{FONTS}}", fonts)
            .replace("{{CSS}}", read("engine", "engine.css"))
            .replace("{{THEME_CSS}}", theme_css)
            .replace("{{THEME_JS}}", theme_js)
            .replace("{{KATEX_CSS}}", kcss)
            .replace("{{KATEX_JS}}", kjs)
            .replace("{{BG}}", bg)
            .replace("{{FLOOR}}", floor)
            .replace("{{COURSE_JSON}}", cj)
            .replace("{{JS}}", read("engine", "engine.js")))
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    nq = sum(len(q.get("quiz", [])) for q in course["quests"])
    nc = sum(len(q.get("cards", [])) for q in course["quests"])
    print(f"built {out}  ({len(page) // 1024} KB, theme {theme}, {len(course['quests'])} quests, {nq} quiz questions, {nc} cards)")


if __name__ == "__main__":
    main()
