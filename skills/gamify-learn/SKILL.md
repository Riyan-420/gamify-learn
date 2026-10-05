---
name: gamify-learn
description: Turn course material (lecture slides, PDFs, notes, textbook chapters, a syllabus, or just a topic) into a retro-game-style study game, delivered as one offline HTML file. Short quests, every formula and symbol decoded in plain words, live sliders, quizzes that explain wrong answers, spaced flashcards, boss raids. Use when the user wants to learn or revise from material, asks for gamified or interactive study material, is preparing for a quiz or exam, says they have ADHD or cannot focus on long slides, or complains that slides show formulas without explaining what things are.
---

# gamify-learn

Turn source material into a single-file study game. You write a `course.json`; the bundled engine turns it into a retro (light-blue sky, red) HTML game with XP, levels, streaks, badges, boss raids and spaced review. No server, no internet, no dependencies.

The teaching is the point, the game is the wrapper. A game that shows a formula without saying what each symbol IS has failed, however pretty it is.

## Workflow

1. **Ask before assuming** (max 3 short questions, skip what the user already said):
   - Where is the material, and which parts matter (whole course? one lecture? exam topics)?
   - How much do they already know? Default assumption: **zero**. Every symbol, abbreviation and term gets explained.
   - Exam format or deadline (multiple choice? derivations? how many days?). This sets quiz style and quest count.
2. **Extract.** `python scripts/extract_text.py <file-or-folder> -o extracted` (pdf, pptx, docx, txt, md, html; add `--images` to save pptx pictures). If a PDF is scanned (no text), say so and ask for another source or use OCR if available. Read the extracted text fully before planning.
3. **Plan quests.** Write a coverage list: every topic in the source mapped to a quest. One quest = one idea cluster, about 8 to 14 screens, about 12 minutes. Order them as a story (each quest should lean on the previous one; say so). Show the plan to the user in a few lines and let them adjust before you write 10,000 words of JSON.
4. **Author `course.json`.** Follow `references/authoring-guide.md` (teaching rules, mandatory) and `references/schema.md` (fields). Start from `examples/compound-interest/course.json` if you want a working pattern to copy.
5. **Check, build, test.**
   ```
   python scripts/validate.py course.json
   python scripts/build.py course.json -o <Name>.html
   python scripts/smoke_test.py <Name>.html
   ```
   Fix every ERROR. Read every warning and fix the ones that apply. Add `?reveal` to the URL to see every screen fully revealed (useful for screenshots or printing).
6. **Look at it.** Open the HTML (or screenshot it) and check at least one decoder screen, one lab, one quiz screen and the map. Report honestly what you verified and what you did not.
7. **Hand over.** Tell the user the file path, how to start (open in any browser; progress saves in that browser, use Menu then Export to move it), the quest list, and which source topics are covered or deliberately left out.

## Non-negotiable teaching rules

- **Decode every formula.** Any equation, symbol or abbreviation appears first in a `decode` step: formula on top, then one card per symbol with name, plain-words meaning, and the **effect** (what happens to the answer when it goes up). Colour-link with `[[0|x]]`. Say how to read it aloud. No orphan symbols, ever.
- **Concrete before abstract.** Order: question to guess (`predict`), analogy or everyday picture, tiny example, then the formal rule. Never open with the definition.
- **Show it moving.** If a formula has parameters, add a `lab` with sliders and a plot so the learner pulls every lever. Write `tries` that say what to do and what to notice.
- **Worked examples with real numbers.** Every number is computed (run Python, do not do it in your head) and every step is labelled. State units.
- **Name the traps.** Add a `trap` for the mistake that costs marks (units, sign, off-by-one, confusing two similar things).
- **Retrieval beats re-reading.** Each quest ends with a 60-second brain dump, 5 to 10 quiz questions (3 plausible distractors, a `why` that explains the right answer and the tempting wrong one), and 5 to 10 flashcards.
- **Chunk.** At most 5 lines per `idea`, one thought per line, under about 25 words. Split long quests.
- **Define on first use.** Add every term and symbol to the top-level `glossary` (the learner opens it with G).
- **Do not invent.** Everything must trace to the source or to well-established facts you are sure of. If the source is unclear or contradicts itself, say so to the user instead of smoothing it over. Put the source section in quiz `tag`s (for example `L2 §3`) so the learner can find it.
- **Figures.** Reuse real figures from the source only for the user's own study, with a caption that says what to look at and a `credit`. Do not publish copyrighted figures. When you cannot or should not reuse one, draw it with a `lab` plot or an inline SVG.

## Design choices already made (do not fight them)

- Retro look: light-blue sky, red accents, pixel fonts embedded in the file. Calm mode (Menu) switches off motion and sound for people who find the game layer distracting.
- Sound is off by default. No timers that punish. Misses go to a retry list and return in raids; a missed raid question comes back once before the boss falls.
- Games are a wrapper. The evidence for gamification is mixed (see `references/evidence.md`); the evidence for short chunks, testing yourself and spaced review is stronger. Do not oversell it to the user.

## Files in this skill

| Path | What |
|---|---|
| `scripts/extract_text.py` | pdf / pptx / docx / html to text (and pptx images) |
| `scripts/validate.py` | schema errors plus teaching-quality warnings |
| `scripts/build.py` | course.json to one self-contained HTML |
| `scripts/smoke_test.py` | headless Chrome renders every screen and checks the lab maths |
| `assets/engine/` | the game (CSS, JS, template) and `assets/fonts/` (OFL pixel fonts) |
| `references/schema.md` | every field of course.json |
| `references/authoring-guide.md` | how to write a course that actually teaches |
| `references/evidence.md` | the research behind the design, with honest limits |
| `examples/compound-interest/` | complete demo course + built game |
