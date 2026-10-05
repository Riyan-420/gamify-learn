# Authoring guide: how to write a course that teaches

Read this and `learning-line.md` (sequencing, linking, relearning) before writing any `course.json`. The engine is the easy part. Whether someone with zero background can learn everything and then solve exam questions depends on what you write.

## The test you must pass

Imagine a reader who has never seen the topic. Walk through your quest one screen at a time. At every symbol, word or abbreviation ask: **"Has this been defined, in plain words, before this point?"** If not, stop and fix it. Repeat until a full pass has no surprises.

The failure this skill exists to prevent: slides that show `P_C = R(P_W - C)` or "DoF" and never say what `P_C`, `R`, `C` or DoF are, what each does, or why it is there.

## Shape of a quest (copy this)

1. **predict** a surprising, concrete question the quest will answer.
2. **idea** x 1 to 3: the plain picture. Analogy first, tiny example second, rule third.
3. **decode**: the formula or notation, symbol by symbol.
4. **worked**: one full numeric example, every step labelled.
5. **lab**: sliders for the same formula so the learner sees each symbol act.
6. **idea** (trap or edge case): where people lose marks.
7. **dump**: 60-second recall.
8. quiz (5 to 10), cards (5 to 10), recap with teach-back (automatic).

Short quests are fine (6 to 8 screens). If a quest passes about 14 screens, split it.

## Decoder cards: what to write

For each symbol, three things:

- **name**: the full name in capitals ("PRINCIPAL", "ROTATION MATRIX").
- **plain**: what it IS, in words a child could follow, with a concrete picture or unit. Not "the rotation" but "a 3x3 table of numbers that turns a direction around the origin".
- **effect**: what moves when this symbol goes up, down or flips sign. This is the part slides usually skip and the part exams test.

Also: say **how to read the formula aloud**; define subscripts and superscripts (what is the small `W` in `P_W`?); state the **units** and **ranges** (decimal vs percent, radians vs degrees, pixels vs millimetres); and flag **sign and order conventions** (matrix order matters, y-axis direction, which frame a vector lives in).

If a symbol is a matrix or vector, show a small numeric instance in a `worked` step so the learner sees the shape and one actual multiplication.

## Labs: make symbols move

If a formula has parameters, a lab is worth more than another paragraph. Pattern:

- One slider per symbol the learner should understand.
- Two or three `outputs` that update live (the thing the formula computes, plus one comparison).
- A `plot` (curve in x) or an `svg` template (a picture that changes: a triangle that tilts, a lens that moves, a bar that grows) so the effect is visible, not just a number.
- `tries`: three or four imperatives ("Set t to 5, then 40. Where does the curve pull away?").

If the source has a figure that shows the same thing, put it in a `figure` step right before the lab and refer to it in the lab's `intro`.

## Worked examples

- Choose numbers that make arithmetic clean but not trivial.
- Compute with Python, not in your head. Paste the printed values.
- Each step: a label that names the move ("Slice the rate"), then the work.
- End with units and a sanity check ("is the size plausible?").
- Add a second worked example for hard topics, with a twist (negative sign, different units).

## Quiz questions

- Test understanding, not wording. Prefer "what happens to X if Y doubles" and "which of these is wrong and why" over "what is the definition of".
- Distractors must be tempting: the common wrong value, the sign-flipped answer, the formula from a neighbouring topic, the unit slip. Never silly ones.
- Keep the options similar in length. The correct answer must not be the longest.
- `why`: explain the right answer and name the exact mistake the best distractor represents.
- Add a `tag` with the source location so the learner can go back and read it.
- Mix kinds across a quest: recall, decoder meaning, compute, spot-the-trap, link to an earlier quest.

## Flashcards

One fact per card. Front is a question the learner can answer aloud, not a topic name. Back is the shortest correct answer. Include a card for every symbol in every decoder.

## Linking quests into a story

State the link on screen: "Quest 2 turned a 3D point into a 2D point. Quest 3 asks: where is the camera that did it?" Put at least one question in each quest that needs an earlier quest (interleaving; raids will mix them anyway).

## ADHD-friendly writing (useful for everyone)

- One idea per screen. Lines reveal one at a time so the learner controls pace.
- Short sentences. Concrete nouns. No filler.
- Start each quest with its outcome ("by the end you can...") and an easy first screen.
- Never make the learner wait or sit through a lecture-length wall of text.
- Offer a way out of overwhelm ("too much? do the next 3 screens"): the engine adds it to every mission screen.
- Do not add decoration that is not information. Novelty in structure is fine; novelty that competes with the content is not.

## Fidelity and honesty

- Cover what the source covers. Keep the coverage list; before delivering, tick every source topic against a quest, a glossary entry or a card.
- If something in the source is unclear, wrong, or inconsistent between lecture and book, tell the user. Do not silently "fix" it. Mark it in the quest: "The lecture draws y up; the book uses y down. Here we follow the book."
- Do not state numbers you did not compute or facts you are not sure of.
- Do not paste long passages from copyrighted sources; explain in your own words.

## Final checklist

- [ ] `validate.py` has no errors and every warning is either fixed or consciously accepted.
- [ ] `smoke_test.py` passes.
- [ ] Every formula has a decoder; every abbreviation is in the glossary.
- [ ] Every worked example was computed with code.
- [ ] Every quiz `why` explains the tempting wrong answer.
- [ ] I opened the game and looked at a decoder, a lab, a quiz and the map.
- [ ] The user knows which source topics are covered and which are not.
