---
name: gamify-learn
description: Turn course material (lecture slides, PDFs, notes, textbook chapters, a syllabus, or just a topic) into a retro-game study game, one offline HTML file, that teaches in one straight line from zero to solving problems. Quests unlock in order, every idea is taught once and then deliberately relearned, every formula is decoded symbol by symbol, labs show each symbol acting, and the finale is solving. Built on ADHD and learning-science research. Use when the user wants to learn or revise from material, wants gamified or interactive study material, is preparing for a quiz or exam, says they have ADHD or cannot focus on long slides, or complains that slides show formulas without explaining what things are.
---

# gamify-learn

You write a `course.json`; the bundled engine turns it into a retro (light-blue sky, red) HTML game with XP, levels, streaks, badges, boss raids, quizzes and spaced review. No server, no internet, no dependencies.

**The teaching is the point, the game is the wrapper.** The learner may have ADHD and has never seen the topic. They want maximum learning, interest that stays high, concepts relearned several times, everything linked into one story, and to finish able to *solve* problems. Everything below serves that.

## The Learning Line (non-negotiable)

1. **One direction.** Build a prerequisite map of the source, then order quests along it. Each concept is **taught exactly once**, in the quest where the learner is ready for it, and **never referenced before it is taught**. No jumping around, no mixing topics in a quest. The engine locks quests in order (Menu can unlock) and `validate.py` rejects forward references.
2. **A story spine.** Every quest has a `question` (a curiosity gap the quest closes), a `previously` (how it grows out of the last quest) and a `next_hook` (the cliffhanger into the next one). Reuse one running example across quests when you can. The learner should always know: where am I, how did I get here, what comes next.
3. **Relearn on purpose.** A concept taught once is forgotten. Every concept needs **3 or more touchpoints after it is taught, at least one in a later quest**: quiz questions and flashcards tagged with `concepts`, worked/lab/solve steps that list it in `needs`. The engine adds an automatic **warm-up** to every quest (3 questions from earlier quests, weighted toward what this quest needs and what was missed), a **skill line** where each concept's pips fill as it is answered correctly across quests, spaced flashcards (1, 2, 4, 7, 14 days) and mixed-topic boss raids.
4. **Teach, check, apply, solve.** After each new idea, a quick quiz question (retrieval, not re-reading). Then a worked example, then fading support: a `solve` step with a hint ladder, then solve steps with fewer hints. The **last quest is a capstone of `solve` steps** that mix everything learned. Done means: can solve it without the steps.
5. **See it, properly.** Every idea that can be pictured gets an **illustration**, not decoration: a clean vector diagram (white cards, the navy/red/blue palette, readable sans-serif text, NOT pixel art) that shows the real mechanism and **builds up one stage per press** with a numbered note under each stage, so the learner can rebuild it in their head. Use `scripts/svgkit.py` (`Fig`, `box`, `arrow`, `axes` ...). Also `lab` (sliders, live plot or live `svg`), `flow`, `compare`, `figure`. Real figures from the source are welcome (for the learner's own use). See "Illustrations" in `references/authoring-guide.md`.
6. **Keep interest high.** Open each quest with a `predict`. Never more than 3 passive screens in a row (validator warns): alternate learn / do. Short quests (8 to 14 screens, about 12 minutes), quick wins first, curiosity questions, visible progress. No decoration that competes with the content; novelty belongs in the structure, not in random flash.

## Research behind these rules

Full notes, limits and sources in `references/evidence.md`. Summary the assistant must keep in mind (and tell the user honestly: most ADHD studies are small or with children; gamification evidence is mixed):

| Finding | Design rule |
|---|---|
| Short segments with pauses helped learners with ADHD more than others in a small 2026 study; segmentation helps lower working memory | One idea per screen, ~12-minute quests, lines reveal one at a time |
| Practice testing helps college students with ADHD (d about 0.5) but does **not** repair poor first encoding | Teach clearly first, then test: quiz after every idea, never instead of explaining |
| Spaced practice beats massing; a meta-analysis of spaced retrieval found expanding vs uniform spacing about equal | Relearn in later quests and across days; the schedule matters less than the repeated, spaced retrieval |
| Curiosity (prediction errors, information gaps) boosts encoding and consolidation (PACE framework) | `predict` first, a `question` per quest, cliffhanger `next_hook` |
| Worked examples help novices; fading steps into problems is the bridge; they lose value as expertise grows (expertise reversal) | worked then `solve` with hint ladder then capstone; do not over-scaffold late |
| Feedback + levels helped attention and scores in one RCT; game-based programs show small to moderate, mixed effects | XP, streaks, badges as a thin layer; **Calm mode** switches them off |
| Adults with ADHD chose novelty more and did worse | Fixed, predictable structure; no random flashy elements |
| One exercise bout gave small, short attention gains; body doubling inconclusive | Optional focus timer with a movement break; suggest, do not claim |

"Interest-based nervous system" is a popular label, not a tested model: do not present it as science.

## Workflow

1. **Ask before assuming** (max 3 short questions, skip what is already known): where is the material and which parts matter; how much do they already know (default **zero**); exam format/deadline.
2. **Extract.** `python scripts/extract_text.py <file-or-folder> -o extracted` (pdf, pptx, docx, txt, md, html; `--images` saves pptx pictures). Scanned PDFs have no text: say so. Read all of it before planning.
3. **Map the line.** Write the prerequisite map: every concept in the source, what it depends on, the order that respects the dependencies, and which quest teaches it. Group into quests of at most about 5 new concepts. Resolve conflicts between lecture and book openly. **Show the user the ordered quest list and the concept list and get a yes before writing the JSON.** Add a last capstone quest.
4. **Author `course.json`** following `references/authoring-guide.md` (how to teach), `references/learning-line.md` (how to sequence and relearn) and `references/schema.md` (fields). Copy `examples/compound-interest/course.json`: it uses every feature.
5. **Check, build, test.**
   ```
   python scripts/validate.py course.json --strict
   python scripts/build.py course.json -o <Name>.html
   python scripts/smoke_test.py <Name>.html
   ```
   Fix every ERROR. In `--strict` mode every warning must be fixed or consciously accepted (and told to the user). `?reveal` on the URL shows every screen fully (screenshots, printing).
6. **Look at it.** Open or screenshot at least: the map, a mission screen, a decoder, a lab, a warm-up, a solve step. Say honestly what you checked.
7. **Phone.** If the learner will use a phone, run `python scripts/mobile_test.py <Name>.html --w 390` and point them to `docs/PHONE.md` (iPhone and Android steps). Offer a phone-sized PDF if they want to read without sliders.
8. **Hand over.** File path; how to start (double-click, any browser; progress saves in that browser, Menu then Export); the quest list as a story; which source topics are covered or left out; the honest limits.

## Teaching rules inside every quest

- **Decode every formula.** A `decode` step: formula, how to say it aloud, then per symbol a card with name, plain-words meaning and the **effect** of raising it. `[[0|x]]` colour-links formula to cards. No orphan symbol, no undefined abbreviation (glossary too).
- **Concrete before abstract:** guess, picture/analogy, tiny example, then the rule.
- **Show it moving:** parameters get a lab; write `tries` that say what to do and notice.
- **Real numbers, computed:** run Python for every worked and solve value; label every step; state units; add a sanity check.
- **Name the trap** that costs marks.
- **Quiz well:** tempting distractors, `why` explains the right answer and the best wrong one, `tag` points to the source section, `concepts` lists what it tests.
- **Do not invent.** Everything traces to the source or to facts you are sure of. If the source is unclear, wrong or inconsistent, tell the user rather than smoothing it over.
- **Figures and copyright:** reuse source figures only for the user's own study, with caption and `credit`. Never publish copyrighted material.

## Files in this skill

| Path | What |
|---|---|
| `scripts/extract_text.py` | pdf / pptx / docx / html to text (and pptx images) |
| `scripts/validate.py` | schema errors, the one-direction concept ledger, teaching-quality warnings (`--strict`) |
| `scripts/build.py` | course.json to one self-contained HTML |
| `scripts/smoke_test.py` | headless Chrome renders every screen and checks the lab maths |
| `scripts/mobile_test.py` | optional: phone-emulated check of every screen for sideways overflow |
| `scripts/svgkit.py` | helpers for clean, staged explanatory illustrations |
| `assets/engine/`, `assets/fonts/` | the game (CSS, JS, template) and OFL pixel fonts |
| `references/learning-line.md` | how to sequence, link and relearn |
| `references/authoring-guide.md` | how to write a course that teaches |
| `references/schema.md` | every field of course.json |
| `references/evidence.md` | the research, with honest limits and sources |
| `examples/compound-interest/` | four-quest demo course + built game |
