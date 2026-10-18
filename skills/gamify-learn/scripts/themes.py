#!/usr/bin/env python3
"""Theme registry for gamify-learn.

A theme is a look, not a different game: same engine, same course.json. Pick one with
`build.py course.json --theme pastel` or `"theme": "pastel"` at the top of course.json.

retro   pixel fonts, light-blue sky, red, chunky borders (the default; engine.css alone)
pastel  minimal, modern, smooth: soft lilac / peach / mint, glass panels, rounded vector icons,
        system rounded font. Files: assets/themes/pastel/theme.css + theme.js

Illustrations are authored once in the default palette (svgkit.py). For any non-retro theme the build maps
those colours to the theme palette (and softens corners and shadows), so every existing course can be re-themed
without touching its JSON.
"""
import re

THEMES = {
    "retro": {"color": "#1d3557"},
    "pastel": {"color": "#f6f4ff"},
}

# retro colour (lower-case hex)  ->  pastel colour
PASTEL = {
    "#1d3557": "#5b6199",   # NAVY  strokes
    "#12213f": "#3a3d66",   # INK   text
    "#e63946": "#ff7f96",   # RED   accent
    "#a4161a": "#c2415f",   # RED2  accent text
    "#1f7fd1": "#6f8df0",   # BLUE
    "#2a9df4": "#79a7f7",
    "#1769ab": "#4f6fd8",
    "#bfe6ff": "#dbe4ff",   # BLUE2
    "#e3f4ff": "#eef2ff",   # SKY
    "#c4e8ff": "#e0e7ff",   # SKY2
    "#7cc4f5": "#cfd6ff",
    "#9fd8ff": "#dde2ff",
    "#8fe3ff": "#c6ecf0",
    "#fff8ea": "#fff9ef",   # CREAM
    "#fffdf6": "#fffefb",   # PAPER
    "#ffd23f": "#ffd98a",   # GOLD
    "#1a9a5f": "#35b087",   # OK
    "#d8f5e6": "#d9f5ea",   # OK2
    "#8aa0c0": "#a9aed0",   # GREY
    "#dfe9f4": "#eceefa",   # GREY2
    "#40527a": "#6a6e94",   # MUT
    "#ffe3e5": "#ffe6ee",   # PINK
    "#ff9aa0": "#ffc4cf",
    "#0e9bb8": "#55c2bb",   # TEAL
    "#d9552b": "#ff9d6e",   # ORANGE
    "#ff7a85": "#ffa6b5",   # gradient stops
    "#2c4a78": "#8f95d6",
    "#e0c98a": "#f0dca8",   # caption border
    "#0a1329": "#3a3d66",
    "#22345f": "#e1dcff",
}
_FONT_OLD = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
_FONT_NEW = "ui-rounded,'SF Pro Rounded','Nunito','Segoe UI Variable Display','Segoe UI',system-ui,sans-serif"
_HEX = re.compile(r"#[0-9a-fA-F]{6}\b")
_RX = re.compile(r"\brx=(['\"])(\d+(?:\.\d+)?)\1")
_SHADOW = re.compile(r"<feDropShadow[^>]*/>")


def _soften(s):
    """colour map + rounder corners + softer shadow + rounded font, for one SVG/HTML string"""
    s = _HEX.sub(lambda m: PASTEL.get(m.group(0).lower(), m.group(0)), s)
    if "<svg" in s:
        s = _RX.sub(lambda m: f"rx={m.group(1)}{round(float(m.group(2)) * 1.8, 1)}{m.group(1)}" if float(m.group(2)) >= 2 else m.group(0), s)
        s = _SHADOW.sub("<feDropShadow dx='0' dy='4' stdDeviation='4.5' flood-color='#5b4fd0' flood-opacity='.16'/>", s)
        s = s.replace(_FONT_OLD, _FONT_NEW)
    return s


def retheme(node, theme):
    """Return node with every string re-coloured for `theme` (retro = unchanged)."""
    if theme == "retro":
        return node
    if isinstance(node, str):
        return _soften(node) if ("#" in node or "<svg" in node) else node
    if isinstance(node, list):
        return [retheme(v, theme) for v in node]
    if isinstance(node, dict):
        return {k: retheme(v, theme) for k, v in node.items()}
    return node
