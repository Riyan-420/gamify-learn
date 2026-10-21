#!/usr/bin/env python3
"""Theme registry for gamify-learn.

A theme is a look, not a different game: same engine, same course.json. Pick one with
`build.py course.json --theme minimal` or `"theme": "minimal"` at the top of course.json.

retro    8-bit arcade: pixel fonts, light-blue sky, red, chunky borders (the default; engine.css alone)
minimal  quiet study sheet: cool white paper, ink, one focus blue, a highlighter for key words, hairline rules,
         no shadows or gradients, Instrument Sans + Crimson Pro for formulas, monoline icons
modern   bold sticker sheet: 2px ink outlines, hard offset shadows, electric blue + sun yellow, chunky
         press-down buttons, Bricolage Grotesque headings + Instrument Sans body, flat sticker icons

Every non-retro theme lives in assets/themes/<name>/ as
  theme.json  label, browser colour, embedded fonts, background markup, illustration recolouring
  theme.css   loaded after engine.css (same-specificity rules win)
  theme.js    sets window.__THEME = {name, icons, palette} before the engine runs

Illustrations are authored once in the retro palette (svgkit.py). For other themes the build maps those
colours through the theme's "svg.map", scales corner radii and swaps the drop shadow, so any existing course
can be re-themed without touching its JSON. `pastel` (v1.3.0 preview) is kept as an alias of `minimal`.
"""
import colorsys
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
THEME_DIR = os.path.join(HERE, "..", "assets", "themes")
ALIASES = {"pastel": "minimal"}
_RETRO = {"label": "Retro", "color": "#1d3557"}
_FONT_OLD = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
_HEX = re.compile(r"#[0-9a-fA-F]{6}\b")
_RX = re.compile(r"\brx=(['\"])(\d+(?:\.\d+)?)\1")
_SHADOW = re.compile(r"<feDropShadow[^>]*/>")
_cache = {}


def names():
    """Theme names a user may pick (aliases not listed)."""
    found = sorted(d for d in os.listdir(THEME_DIR) if os.path.isfile(os.path.join(THEME_DIR, d, "theme.json")))
    return ["retro"] + found


def resolve(name):
    """Canonical theme name, or None if unknown."""
    name = ALIASES.get(name, name)
    return name if name in names() else None


def load(name):
    """theme.json for a theme (retro has a small built-in record)."""
    if name == "retro":
        return _RETRO
    if name not in _cache:
        with open(os.path.join(THEME_DIR, name, "theme.json"), encoding="utf-8") as f:
            _cache[name] = json.load(f)
    return _cache[name]


def _hls(h):
    return colorsys.rgb_to_hls(*(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)))


def _hex(h, l, s):
    return "#" + "".join(f"{round(v * 255):02x}" for v in colorsys.hls_to_rgb(h, l, s))


def _snap(c, svg):
    """Colour not in the exact map: move it to the nearest theme hue, keep its lightness.
    Lets hand-picked colours from any palette (e.g. old pastel courses) follow the theme."""
    hues = svg.get("hues")
    if not hues:
        return c
    h, l, s = _hls(c)
    if l > .97 or l < .04:
        return c
    if s < .16:
        nh, _, ns = _hls(svg.get("neutral", "#808080"))
        return _hex(nh, l, min(s, ns))
    best = min(hues, key=lambda a: min(abs(_hls(a)[0] - h), 1 - abs(_hls(a)[0] - h)))
    ah, al, as_ = _hls(best)
    return _hex(ah, l, min(as_, max(s, .35)))


def _colour(m, svg):
    c = m.group(0).lower()
    return svg["map"].get(c) or _snap(c, svg)


def _restyle(s, svg):
    s = _HEX.sub(lambda m: _colour(m, svg), s)
    if "<svg" in s:
        k = svg.get("rx_scale", 1)
        if k != 1:
            s = _RX.sub(lambda m: f"rx={m.group(1)}{round(float(m.group(2)) * k, 1)}{m.group(1)}" if float(m.group(2)) >= 2 else m.group(0), s)
        if "shadow" in svg:
            s = _SHADOW.sub(svg["shadow"], s)
        if svg.get("font"):
            s = s.replace(_FONT_OLD, svg["font"])
    return s


def retheme(node, theme):
    """Return node with every string re-coloured for `theme` (retro = unchanged)."""
    if theme == "retro":
        return node
    svg = load(theme)["svg"]

    def walk(n):
        if isinstance(n, str):
            return _restyle(n, svg) if ("#" in n or "<svg" in n) else n
        if isinstance(n, list):
            return [walk(v) for v in n]
        if isinstance(n, dict):
            return {k: walk(v) for k, v in n.items()}
        return n
    return walk(node)
