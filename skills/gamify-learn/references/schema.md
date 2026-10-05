# course.json schema

Text fields accept light markup:

| Markup | Result |
|---|---|
| `**bold**` | highlighted key term |
| `` `code` `` | monospace chip |
| `==text==` | yellow highlight |
| `[[0|x]]` ... `[[5|x]]` | symbol coloured with palette slot 0 to 5 (use the same slot in `formula` and in the matching `parts[].sym`) |
| raw HTML (`<sup>`, `<sub>`, `&asymp;`, `<svg>`) | passed through. The file is yours, there is no sanitising |

Relative image paths (`"src": "fig/a.png"`) are inlined as base64 by `build.py`, so the output stays one file. Keep images under about 1 MB each.

## Top level

```json
{
  "title": "Compound Interest",
  "slug": "compound-interest",
  "subtitle": "One line shown on the title screen and map",
  "about": "Optional note shown in How it works",
  "lang": "en",
  "focus_minutes": 15,
  "linear": true,
  "concepts": [{"id": "principal", "name": "Principal (P)"}],
  "glossary": [{"term": "Principal (P)", "meaning": "...", "where": "Quest 1"}],
  "quests": [ ... ]
}
```

`slug` namespaces the saved progress in the browser. Give every course its own slug.
`linear` (default true) locks each quest until the previous one is finished; the learner can switch the lock off in Menu.
`concepts` gives display names to concept ids (ids used in `teaches`, `needs`, `concepts`). Any id used in `teaches` is added automatically with a prettified name if you leave it out. See `learning-line.md`.

## Quest

```json
{
  "id": "q1",                    // letters/digits/underscore only (no '-')
  "title": "Money that makes money",
  "world": "1-1",                // label on the map, optional
  "minutes": 12,
  "outcomes": ["Can do X", "Can say Y"],   // required, shown as 'by the end you can...'
  "question": "The curiosity gap this quest closes",       // strongly recommended
  "previously": "How this grows out of the last quest",    // quests 2+, shown on the mission screen
  "next_hook": "Cliffhanger into the next quest",          // shown on the recap
  "needs": ["concept_id"],       // concepts from earlier quests this quest leans on (warm-up uses it)
  "warmup": true,                // set false to drop the automatic warm-up
  "steps": [ ... ],              // see step types
  "quiz": [ ... ],               // 5-10 questions
  "cards": [ ... ],              // 5-10 flashcards
  "recap": {"lines": ["..."], "teach": "30-second teach-back prompt"}
}
```

Quiz questions are placed where you put a `{"type":"quiz","ids":["q1"]}` step (mid-quest checks right after the idea they test); any not placed are appended after the steps. Flashcards likewise (`{"type":"cards"}`, otherwise appended). The engine adds a mission screen first (with the story track, question, last time, concepts you will use and the new ones), an automatic **warm-up** after it for quests 2+ (3 questions from earlier quests), and a recap last (concepts you now know, next up).

## Concept ledger fields (on any step)

`"teaches": ["id"]` introduces concepts (each id exactly once in the whole course). `"needs": ["id"]` uses concepts taught earlier. `validate.py` rejects forward references and double teaching. Quiz questions and cards take `"concepts": ["id"]` (what they test). These tags drive the warm-ups, the skill line and the relearning checks.

## Step types

### predict
Guess first. Learner commits, then sees the answer. Awards a small XP bonus.
`{"type":"predict","prompt":"...","answer":"..."}`

### idea
The workhorse. Lines reveal one at a time (SPACE).
`{"type":"idea","title":"...","lines":["...", "..."],"analogy":"...","example":"...","keep":"...","trap":"...","viz":"<svg>...</svg>","src":"fig.png","caption":"..."}`
Only `title` and `lines` are required. Max about 5 lines.

### decode
Formula and what every symbol IS.
```json
{"type":"decode","title":"Decode the formula","intro":"optional",
 "formula":"[[0|A]] = [[1|P]] (1 + [[2|r]])<sup>[[3|t]]</sup>",
 "read":"A equals P times ... (how to say it aloud)",
 "parts":[{"sym":"[[0|A]]","name":"AMOUNT","plain":"plain-words meaning","effect":"what changes when it goes up"}],
 "note":"keep-this box","trap":"common mistake","viz":"<svg/>","src":"fig.png"}
```
`parts` need `sym`, `name`, `plain`; `effect` is strongly recommended.

### worked
`{"type":"worked","title":"...","problem":"...","steps":[{"label":"Slice the rate","work":"r/n = 0.06/12 = 0.005"}],"answer":"..."}`

### lab
Live sliders. Evaluate JavaScript expressions over control ids; `Math` functions are available bare (`pow`, `log`, `sqrt`, `sin`, `PI`...).
```json
{"type":"lab","title":"...","intro":"...",
 "controls":[{"id":"r","label":"r: rate","min":0.01,"max":0.15,"step":0.005,"value":0.1,"fmt":"%","unit":""}],
 "outputs":[{"label":"Final amount","expr":"P*pow(1+r,t)","fmt":"$0","unit":""}],
 "plot":{"x":[0,40],"at":"t","xlabel":"years","ylabel":"balance","ymin":0,"ymax":50000,
         "series":[{"expr":"P*pow(1+r,x)","label":"compound","color":"#e63946"}]},
 "svg":"<svg viewBox='0 0 400 200'><circle cx='{{ 100 + t*4 }}' cy='100' r='{{ r*100 }}'/></svg>",
 "tries":["Do X and notice Y"],"keep":"..."}
```
- `controls[].id` must be a JS identifier. `x` is reserved as the plot variable.
- `fmt`: `0` `1` `2` `3` (decimals), `$` (dollars, 2dp), `$0`, `%` (value 0.1 shown as 10.0%), `%0`, `sci`, or empty for automatic.
- `plot`: any number of series; `at` names the control whose value is marked on the curve. Axis ticks are chosen automatically.
- `svg`: your own drawing. Every `{{expression}}` is re-evaluated when a slider moves, so you can make shapes, arrows and bars respond to the controls. Use this for geometry, circuits, ray diagrams, anything a line chart cannot show.
- At least one of `outputs`, `plot`, `svg` is required. Outputs must be finite numbers at the default values (`smoke_test.py` checks).

### figure
A picture from the source with a purpose.
`{"type":"figure","title":"...","src":"fig/a.png","caption":"Look at the red arrow: ...","credit":"Lecture 2, slide 14","lines":["optional bullets"],"keep":"..."}` or `"svg":"<svg>...</svg>"` instead of `src`.

### flow
A process as boxes and arrows that appear one at a time. Use it for pipelines, loops, algorithms, causal chains.
`{"type":"flow","title":"...","intro":"...","nodes":[{"label":"START","sub":"Balance B = $1,000"},{"label":"SLICE","sub":"Interest = B x r"}],"lines":["optional"],"keep":"...","trap":"..."}`

### compare
Side-by-side table, one row per reveal. Use it for two similar things people confuse.
`{"type":"compare","title":"...","headers":["Simple","Compound"],"rows":[["Interest is paid on","original deposit only","deposit plus earned interest"]],"keep":"..."}`

### solve
"Your turn": problem, then a hint ladder, then the solution after the attempt. The learner rates themselves (got it / with hints / not yet). Not-yet solves can be redone from the map. Awards XP and counts as a relearning touchpoint for its `needs`.
`{"type":"solve","title":"Your turn 1","problem":"...","hints":["nudge","method","near-answer"],"steps":[{"label":"...","work":"..."}],"answer":"...","needs":["concept_id"]}`

### dump
60-second brain dump. Learner types or speaks, then ticks what they remembered.
`{"type":"dump","prompt":"...","points":["checklist item","..."]}`

### html
Escape hatch: `{"type":"html","title":"optional","html":"<div>...</div>"}`.

### quiz / cards
Placement markers (see Quest).

## Quiz question

```json
{"id":"q1","q":"Question text","answer":"Correct option",
 "wrong":["Distractor 1","Distractor 2","Distractor 3"],
 "why":"Why it is right AND what the tempting wrong answer gets wrong","tag":"DECODER","concepts":["rate"]}
```
Options are shuffled every time. 2 to 3 distractors; 3 is best. `id` is optional (auto q1, q2...).

## Flashcard

`{"front":"Question or term","back":"Answer","concepts":["principal"]}` (also accepts `f` / `b`).

## Glossary entry

`{"term":"Principal (P)","meaning":"plain-words definition","where":"Quest 1"}`; terms accept `[[n|x]]` markup.

## URL switches (for you, not the learner)

- `?selftest` renders every screen and writes the result into `<pre id="selftest">`.
- `?reveal` reveals every hidden piece on each screen, auto-answers quiz questions, stops animation and bypasses the quest lock (screenshots, printing).
- `#q2/5` jumps to quest 2, screen 5. `#map`, `#title`.

## Learner keys

SPACE / right arrow = reveal or next, left arrow = back, A to D or 1 to 4 = answer, H = map, R = daily review, G = glossary, T = focus timer, M = sound, Esc = close.
