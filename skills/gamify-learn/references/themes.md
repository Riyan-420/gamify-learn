# Themes: ask every time, then build

The look is the learner's call, not yours. **Before writing any course.json, ask which style they want**, every time a game is made (unless they already named one in this request). Same engine, same course, three looks; switching later is one rebuild.

## How to ask

If the `AskUserQuestion` tool exists, use it with exactly this question (one question, three options, each with its `preview`). Otherwise ask the same thing in plain text with the three short descriptions.

- question: `Which style should the study game use?`
- header: `Style`
- multiSelect: `false`

| label | description | preview (pass as the option's `preview`) |
|---|---|---|
| `Retro` | 8-bit arcade: pixel fonts, light-blue sky, red bricks, chunky borders. Loud and playful. | see block R |
| `Minimal` | A quiet study sheet: white paper, ink, one focus blue, a yellow highlighter on key words. No shadows, no gradients. Best for long focus and late-night revision. | see block M |
| `Modern` | A bold sticker sheet: ink outlines, hard shadows, electric blue and sun yellow, buttons that press down, formulas on a dark chalkboard slab. Energetic. | see block D |

Block R (Retro preview):
```
+==================================+
| ### PIXEL QUEST ###   LV 3 [###] |
|  sky blue  /  red bricks         |
|  +----------------------------+  |
|  | > PRESS START              |  |
|  +----------------------------+  |
|  Press Start 2P + VT323 fonts    |
+==================================+
```

Block M (Minimal preview):
```
 Attention in equations         Lv 3
 ------------------------------------
 Learn   World 4-3
 Raw scores do not add to 1. Apply
 [softmax] to get ==weights==.
   e^t = [ s_t.h_1 ... s_t.h_N ]
 ( Next )        ---- ---- ==== ----
 Instrument Sans . Crimson Pro maths
 white paper, ink, one blue, highlighter
```

Block D (Modern preview):
```
 ##########  NLP  [Q14 8/21]  ######
 +---------------------------------+#
 | [Decoder] [World 4-3]           |#
 | Attention in equations          |#
 | ######## e^t = [s_t.h_i] ###### |#
 | (A) tile  (B) tile  (C) tile    |#
 +---------------------------------+#
  ###############################
 Bricolage Grotesque . yellow + blue
 ink outlines, hard shadows, grid mat
```

Map the answer to the build flag: Retro → `retro`, Minimal → `minimal`, Modern → `modern`. Put it in course.json as `"theme"` so a rebuild keeps it. If the learner picks "Other", ask what they want changed and pick the closest theme; say what you could not match.

## The three themes

| | `retro` | `minimal` | `modern` |
|---|---|---|---|
| Idea | 8-bit arcade cabinet | a study sheet on a desk | stickers on a cutting mat |
| Background | light-blue sky gradient, clouds, brick floor | cool white paper `#f7f8fa` | grey cutting mat with a 28px grid |
| Text | Press Start 2P + VT323 (pixel) | Instrument Sans | Bricolage Grotesque headings, Instrument Sans body |
| Formulas | monospace on a navy slab | Crimson Pro (textbook serif) on white | Crimson Pro on a dark chalkboard slab |
| Accent | red `#e63946` | one focus blue `#2346d8` + yellow highlighter `#ffe680` | sun yellow `#ffc83d` + electric blue `#2f5bff` |
| Edges | 4px pixel borders | 1px hairlines, no shadows | 2px ink outlines, hard 4px offset shadows |
| Buttons | red pixel blocks | ink fill, outline secondary | yellow, press down 3px on click |
| Progress dots | square pixels | one thin segmented line | ink blocks |
| Icons | pixel sprites | monoline ink | flat sticker icons |
| Motion | stepped pixel pops | 180ms fades only | short pop on reveal and press |
| Best for | fun, short sessions, younger learners | long focus, exams, ADHD readers who find colour noisy | gamified drilling, quiz practice |

All three: same quests, quizzes, labs, spaced review and phone layout. All respect `prefers-reduced-motion` and Calm mode. Correct and wrong answers always carry a mark (tick or cross), never colour alone.

## Illustrations follow the theme

Draw illustrations once with `svgkit.py` in the default (retro) palette. At build time each theme's `theme.json` re-colours them:
1. `svg.map`: exact colour swaps for every svgkit palette colour.
2. `svg.hues`: any other colour (hand-picked, or left over from an old course) snaps to the nearest theme hue and keeps its lightness, so stray purples or pinks cannot leak in.
3. `svg.shadow` replaces the drop shadow (none for minimal, a hard ink offset for modern); `svg.rx_scale` rounds corners; `svg.font` swaps the label font.

## Adding a theme

A theme is a folder `assets/themes/<name>/` with:
- `theme.json`: `label`, `pitch`, `color` (browser bar colour), `fonts` (files in `assets/fonts/`, WOFF, OFL licence next to them), `bg` (extra markup behind the app, usually empty), `svg` (see above).
- `theme.css`: overrides for engine classes; loaded after `engine.css`. Copy `minimal/theme.css` and change tokens first.
- `theme.js`: sets `window.__THEME = {name, icons, palette}`; icons are `name -> (px) => svg`, the palette colours confetti and lab plots.

`themes.py` finds it automatically. Add a row to the table above and a preview block to the question, then build the demo with `--theme <name>`, run `smoke_test.py` and `mobile_test.py`, and look at the map, a decoder, a lab, a quiz and a solve step before shipping.

`pastel` (the v1.3.0 preview) is an alias of `minimal`: old courses with `"theme": "pastel"` still build.
