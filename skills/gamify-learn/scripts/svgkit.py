#!/usr/bin/env python3
"""svgkit: small helper library for clean, staged explanatory illustrations (not pixel art).

Use it from a Python script that writes your course.json. It produces inline SVG strings for the `viz` /
`svg` fields. Style: white cards, soft shadow, navy/red/blue palette, system sans-serif text.

Staged build-up: everything added with stage=0 is always visible; stage=1,2,3... is revealed one press at a
time (SPACE / tap) by the engine (elements carry data-s="k"). Each stage can also have a numbered caption
that is appended under the picture, so the learner reads a growing list that matches what appears.

    f = Fig(360, 150)
    f.add(0, rect(20, 20, 120, 60, SKY, NAVY), text(80, 55, "MEMORY"))
    f.add(1, arrow(140, 50, 220, 50, RED))
    f.cap(1, "The core asks memory for a value.")
    svg_string = f.render()
"""
import html as _html

NAVY, INK, RED, RED2, BLUE, BLUE2 = "#1d3557", "#12213f", "#e63946", "#a4161a", "#1f7fd1", "#bfe6ff"
SKY, SKY2, CREAM, GOLD, OK, OK2, GREY, GREY2, MUT = "#e3f4ff", "#c4e8ff", "#fff8ea", "#ffd23f", "#1a9a5f", "#d8f5e6", "#8aa0c0", "#dfe9f4", "#40527a"
PINK, PAPER, TEAL, ORANGE = "#ffe3e5", "#fffdf6", "#0e9bb8", "#d9552b"
FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "Consolas,'Courier New',monospace"

_MARK = {"navy": NAVY, "red": RED, "blue": BLUE, "green": OK, "grey": GREY, "ink": INK, "teal": TEAL}


def esc(s):
    return _html.escape(str(s), quote=False)


def defs():
    d = ["<defs>",
         "<filter id='sk-sh' x='-10%' y='-10%' width='125%' height='135%'><feDropShadow dx='0' dy='1.6' stdDeviation='1.6' flood-color='#1d3557' flood-opacity='.28'/></filter>",
         "<linearGradient id='sk-sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e3f4ff'/><stop offset='1' stop-color='#bfe6ff'/></linearGradient>",
         "<linearGradient id='sk-red' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ff7a85'/><stop offset='1' stop-color='#e63946'/></linearGradient>",
         "<linearGradient id='sk-navy' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2c4a78'/><stop offset='1' stop-color='#1d3557'/></linearGradient>",
         "<pattern id='sk-hatch' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><rect width='6' height='6' fill='#fff'/><line x1='0' y1='0' x2='0' y2='6' stroke='#e63946' stroke-width='2'/></pattern>"]
    for k, c in _MARK.items():
        d.append(f"<marker id='sk-ah-{k}' viewBox='0 0 10 10' refX='8.5' refY='5' markerWidth='6.5' markerHeight='6.5' orient='auto-start-reverse'><path d='M0,0 L10,5 L0,10 z' fill='{c}'/></marker>")
    d.append("</defs>")
    return "".join(d)


def _mk(color):
    for k, c in _MARK.items():
        if c.lower() == color.lower():
            return k
    return "navy"


def wrap(s, n):
    words, lines, cur = str(s).split(), [], ""
    for w in words:
        if len(cur) + len(w) + (1 if cur else 0) > n:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w) if cur else w
    if cur:
        lines.append(cur)
    return lines


# ------------------------------------------------------------- primitives
def rect(x, y, w, h, fill=SKY, stroke=NAVY, r=8, sw=1.6, shadow=False, dash=False, opacity=1):
    d = " stroke-dasharray='5 4'" if dash else ""
    sh = " filter='url(#sk-sh)'" if shadow else ""
    op = f" opacity='{opacity}'" if opacity != 1 else ""
    st = f" stroke='{stroke}' stroke-width='{sw}'" if stroke else ""
    return f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='{fill}'{st}{d}{sh}{op}/>"


def text(x, y, s, size=12, fill=INK, anchor="middle", weight=400, family=None, italic=False, lh=1.25):
    lines = str(s).split("\n")
    fam = family or FONT
    it = " font-style='italic'" if italic else ""
    if len(lines) == 1:
        return f"<text x='{x}' y='{y}' text-anchor='{anchor}' fill='{fill}' font-size='{size}' font-weight='{weight}' font-family=\"{fam}\"{it}>{esc(lines[0])}</text>"
    out = f"<text x='{x}' y='{y}' text-anchor='{anchor}' fill='{fill}' font-size='{size}' font-weight='{weight}' font-family=\"{fam}\"{it}>"
    for i, ln in enumerate(lines):
        out += f"<tspan x='{x}' dy='{0 if i == 0 else round(size * lh, 1)}'>{esc(ln)}</tspan>"
    return out + "</text>"


def line(x1, y1, x2, y2, color=NAVY, w=2, dash=False, cap="round"):
    d = " stroke-dasharray='5 4'" if dash else ""
    return f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{color}' stroke-width='{w}' stroke-linecap='{cap}'{d}/>"


def arrow(x1, y1, x2, y2, color=NAVY, w=2, dash=False, both=False):
    d = " stroke-dasharray='5 4'" if dash else ""
    m = _mk(color)
    ms = f" marker-start='url(#sk-ah-{m})'" if both else ""
    return f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{color}' stroke-width='{w}' stroke-linecap='round'{d} marker-end='url(#sk-ah-{m})'{ms}/>"


def path(d, stroke=NAVY, fill="none", w=2, dash=False, arrow_end=False, opacity=1):
    ds = " stroke-dasharray='5 4'" if dash else ""
    m = f" marker-end='url(#sk-ah-{_mk(stroke)})'" if arrow_end else ""
    op = f" opacity='{opacity}'" if opacity != 1 else ""
    return f"<path d='{d}' fill='{fill}' stroke='{stroke}' stroke-width='{w}' stroke-linecap='round' stroke-linejoin='round'{ds}{m}{op}/>"


def circle(x, y, r, fill=SKY, stroke=NAVY, sw=1.6, shadow=False):
    sh = " filter='url(#sk-sh)'" if shadow else ""
    st = f" stroke='{stroke}' stroke-width='{sw}'" if stroke else ""
    return f"<circle cx='{x}' cy='{y}' r='{r}' fill='{fill}'{st}{sh}/>"


def node(x, y, r, label, fill=SKY, stroke=NAVY, color=INK, size=11, weight=700):
    return circle(x, y, r, fill, stroke, 1.8, True) + text(x, y + size * 0.36, label, size, color, "middle", weight)


def box(x, y, w, h, label="", fill=SKY, stroke=NAVY, size=12, color=INK, sub=None, shadow=True, r=8, weight=700, subsize=None):
    out = rect(x, y, w, h, fill, stroke, r, 1.6, shadow)
    ss = subsize or max(9, size - 2)
    if label and sub:
        out += text(x + w / 2, y + h / 2 - 2, label, size, color, "middle", weight)
        out += text(x + w / 2, y + h / 2 + ss + 3, sub, ss, MUT, "middle", 400)
    elif label:
        n = str(label).count("\n")
        out += text(x + w / 2, y + h / 2 + size * 0.36 - n * size * 0.62, label, size, color, "middle", weight)
    return out


def tag(x, y, label, fill=RED, color="#fff", size=10, pad=7, h=17):
    w = max(18, int(len(str(label)) * size * 0.6) + pad * 2)
    return rect(x - w / 2, y - h / 2, w, h, fill, None, h / 2, 0) + text(x, y + size * 0.36, label, size, color, "middle", 700)


def badge(x, y, n, fill=RED, r=9):
    return circle(x, y, r, fill, None, 0) + text(x, y + 3.6, n, 10.5, "#fff", "middle", 700)


# ------------------------------------------------------------- icons (all drawn from shapes)
def chip(x, y, s=64, label="", fill="url(#sk-navy)", pin=GREY, color="#fff", size=11, hot=False):
    out = ""
    n = 5
    for i in range(n):
        o = s * (i + 1) / (n + 1)
        out += line(x + o, y - 6, x + o, y, pin, 2.4, cap="butt") + line(x + o, y + s, x + o, y + s + 6, pin, 2.4, cap="butt")
        out += line(x - 6, y + o, x, y + o, pin, 2.4, cap="butt") + line(x + s, y + o, x + s + 6, y + o, pin, 2.4, cap="butt")
    out += rect(x, y, s, s, "url(#sk-red)" if hot else fill, NAVY, 7, 1.6, True)
    out += rect(x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, None, "#ffffff55" if not hot else "#ffffff88", 4, 1.2)
    if label:
        out += text(x + s / 2, y + s / 2 + size * 0.36, label, size, color, "middle", 700)
    return out


def flame(x, y, s=30, color=RED):
    k = s / 30
    return (f"<g transform='translate({x},{y}) scale({k})'><path d='M15 0 C17 8 26 11 26 20 C26 27 21 30 15 30 C9 30 4 27 4 20 C4 14 8 12 9 6 C11 9 12 10 13 12 C14 8 14 4 15 0 Z' fill='{color}' stroke='{RED2}' stroke-width='1.2'/>"
            f"<path d='M15 14 C16 18 20 19 20 23 C20 26 18 28 15 28 C12 28 10 26 10 23 C10 20 14 18 15 14 Z' fill='{GOLD}'/></g>")


def person(x, y, s=34, fill=BLUE, label=""):
    k = s / 34
    out = (f"<g transform='translate({x},{y}) scale({k})'><circle cx='17' cy='8' r='7' fill='{fill}' stroke='{NAVY}' stroke-width='1.5'/>"
           f"<path d='M4 32 C4 20 30 20 30 32 Z' fill='{fill}' stroke='{NAVY}' stroke-width='1.5'/></g>")
    if label:
        out += text(x + s / 2, y + s + 12, label, 10, INK, "middle", 700)
    return out


def paper(x, y, w=26, h=32, label="", fill="#fff"):
    out = (f"<path d='M{x} {y} h{w-8} l8 8 v{h-8} h-{w} Z' fill='{fill}' stroke='{NAVY}' stroke-width='1.4'/>"
           f"<path d='M{x+w-8} {y} v8 h8' fill='none' stroke='{NAVY}' stroke-width='1.2'/>")
    for i in range(3):
        out += line(x + 5, y + 14 + i * 6, x + w - 5, y + 14 + i * 6, GREY, 1.2)
    if label:
        out += text(x + w / 2, y + h / 2 + 2, label, 9, RED2, "middle", 700)
    return out


def dram(x, y, w=110, h=34, label="MEMORY"):
    out = rect(x, y, w, h, "#fff8ea", NAVY, 5, 1.6, True)
    for i in range(4):
        out += rect(x + 8 + i * (w - 16) / 4, y + 6, (w - 16) / 4 - 5, 12, NAVY, None, 2, 0)
    for i in range(10):
        out += line(x + 6 + i * (w - 12) / 9, y + h, x + 6 + i * (w - 12) / 9, y + h + 4, GOLD, 2.2, cap="butt")
    out += text(x + w / 2, y + h - 6, label, 9.5, NAVY, "middle", 700)
    return out


def cells(x, y, n, w, h, labels=None, fills=None, stroke=NAVY, size=11, gap=0, colors=None, r=3):
    out = ""
    for i in range(n):
        f = fills[i] if fills and i < len(fills) and fills[i] else "#fff"
        lb = labels[i] if labels and i < len(labels) else ""
        out += rect(x + i * (w + gap), y, w, h, f, stroke, r, 1.4)
        if lb != "":
            col = colors[i] if colors and i < len(colors) and colors[i] else INK
            out += text(x + i * (w + gap) + w / 2, y + h / 2 + size * 0.36, lb, size, col, "middle", 600)
    return out


def axes(x, y, w, h, xlabel="", ylabel="", xticks=(), yticks=(), grid=True):
    """x,y = top-left of plot area. ticks = [(value_fraction 0..1, label)]"""
    out = rect(x, y, w, h, "#fff", NAVY, 3, 1.4)
    for fr, lb in yticks:
        yy = y + h - fr * h
        if grid:
            out += line(x, yy, x + w, yy, GREY2, 1, cap="butt")
        out += text(x - 5, yy + 3.5, lb, 9.5, MUT, "end")
    for fr, lb in xticks:
        xx = x + fr * w
        out += text(xx, y + h + 13, lb, 9.5, MUT, "middle")
    if xlabel:
        out += text(x + w / 2, y + h + 27, xlabel, 10.5, INK, "middle", 600)
    if ylabel:
        out += f"<text transform='rotate(-90 {x-30} {y+h/2})' x='{x-30}' y='{y+h/2}' text-anchor='middle' fill='{INK}' font-size='10.5' font-weight='600' font-family=\"{FONT}\">{esc(ylabel)}</text>"
    return out


# ------------------------------------------------------------- figure with stages + captions
class Fig:
    def __init__(self, w=360, h=180, title=None, caps_width=46):
        self.w, self.h = w, h
        self.layers, self.caps = [], {}
        self.title = title
        self.cw = caps_width

    def add(self, stage, *shapes):
        self.layers.append((stage, "".join(shapes)))
        return self

    def cap(self, stage, s):
        self.caps[stage] = s
        return self

    def render(self):
        capblocks, y = [], self.h + 10
        for st in sorted(self.caps):
            ls = wrap(self.caps[st], self.cw)
            hh = 12 + len(ls) * 15
            g = (rect(8, y, self.w - 16, hh, "#fff8ea", "#e0c98a", 8, 1) + badge(24, y + hh / 2, st) +
                 text(40, y + 17, "\n".join(ls), 12.2, INK, "start", 400, lh=1.22))
            capblocks.append((st, g))
            y += hh + 6
        total = y + 2 if capblocks else self.h
        out = [f"<svg viewBox='0 0 {self.w} {total}' xmlns='http://www.w3.org/2000/svg' style='max-width:100%;height:auto;display:block;margin:0 auto' font-family=\"{FONT}\">", defs()]
        if self.title:
            out.append(text(self.w / 2, 16, self.title, 12.5, NAVY, "middle", 700))
        for st, g in self.layers:
            out.append(g if not st else f"<g data-s='{st}'>{g}</g>")
        for st, g in capblocks:
            out.append(f"<g data-s='{st}'>{g}</g>")
        out.append("</svg>")
        return "".join(out)


def static(w, h, *shapes):
    """One-shot (unstaged) illustration."""
    return f"<svg viewBox='0 0 {w} {h}' xmlns='http://www.w3.org/2000/svg' style='max-width:100%;height:auto;display:block;margin:0 auto' font-family=\"{FONT}\">{defs()}{''.join(shapes)}</svg>"
