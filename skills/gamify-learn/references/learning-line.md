# The Learning Line: sequencing, linking and relearning

How to turn a pile of source material into one straight line of learning that ends with the learner solving problems. Read before planning quests.

## 1. Build the prerequisite map first

Before writing any JSON, produce a table (show it to the user):

| Concept id | Name | Needs (earlier concepts) | Taught in quest |
|---|---|---|---|
| principal | Principal (P) | none | 1 |
| compound | Compound interest | principal | 1 |
| amount | Amount (A) | principal, compound, exponent | 2 |

Rules for the map:

- A concept is something the learner must be able to *use*: a term, a symbol, a rule, a procedure, a unit convention. If an exam question could depend on it, it is a concept.
- Every `needs` points to something taught earlier. If you find a cycle (A needs B, B needs A), split one of them into a simple version taught first and a full version taught later.
- If the source teaches things in a different order, **reorder for the learner** and say so. Lectures often introduce a symbol three slides before explaining it. Do not copy that.
- Group into quests: one cluster of at most about 5 new concepts, 8 to 14 screens, about 12 minutes. A quest title is a question the learner wants answered.
- The last quest teaches nothing new. It is a capstone of `solve` steps that mix earlier concepts.

## 2. Encode it: the concept ledger

In `course.json`:

```json
"concepts": [{"id": "principal", "name": "Principal (P)"}],
"quests": [{
  "steps": [
    {"type": "idea", "teaches": ["principal"], ...},          // taught once, here
    {"type": "decode", "needs": ["principal"], "teaches": ["amount"], ...}
  ],
  "quiz":  [{"concepts": ["principal", "amount"], ...}],       // relearning touchpoints
  "cards": [{"concepts": ["principal"], ...}]
}]
```

`python scripts/validate.py course.json --strict` then enforces:

- **No forward references:** a step, quiz question or card that uses a concept before the step that teaches it is an ERROR.
- **Taught once:** a concept id in `teaches` twice is an ERROR (revisit through `needs` and `concepts`).
- **At most about 5 new concepts per quest** (warning).
- **3 or more touchpoints after teaching** and **at least one in a later quest** for every concept (warnings). This is the relearning guarantee.
- Pacing: more than 3 passive screens in a row (warning), no visual in a quest (warning), no `solve` anywhere (warning).

## 3. The relearning schedule (what the engine does for you)

| When | Mechanism | Where it comes from |
|---|---|---|
| Right after the idea | one quiz question placed mid-quest (`{"type":"quiz","ids":[...]}`) | you place it |
| End of the same quest | 60-second brain dump, remaining quiz, flashcards | you write it |
| Start of the next quest | automatic **warm-up**: 3 questions from earlier quests, weighted to what this quest `needs` and to past misses | engine |
| Next days | flashcards at 1, 2, 4, 7, 14 days (daily review) | engine |
| Any time | **boss raid**: mixed questions from every quest (interleaving), misses return once before the boss falls; **retry misses** | engine |
| Continuously | **skill line**: each concept shows 0 to 3 pips, filled when its tagged questions, cards and solves are answered correctly | engine |

So when you tag questions with `concepts`, you are deciding what gets relearned and when. Tag deliberately: a quiz question in quest 3 that tests a concept from quest 1 is the most valuable kind.

## 4. Link quests into a story

Each quest needs three short texts:

- `question`: the curiosity gap. "How can $1,000 at 10% become about $17,400 when straight-line maths says $4,000?" Concrete, slightly surprising, answerable by the end of the quest.
- `previously`: one or two sentences saying what the last quest gave and why this one is the next step. Leave empty only for quest 1.
- `next_hook`: the cliffhanger. "You can compute a balance. But how long until it doubles?"

Also:
- Reuse one running example where possible so the learner sees the same objects get more powerful.
- Put at least one question per quest that needs an earlier quest.
- Name the link on screen ("Quest 2 turned a 3D point into a 2D point. Quest 3 asks where the camera is.").

## 5. From worked examples to solving

Novices learn faster from worked examples than from unguided problem solving, but the benefit fades as expertise grows, and fading the steps is the bridge. So:

1. `worked`: all steps visible, each labelled.
2. `solve` with **3 hints** (nudge, method, near-answer) and the full solution after the attempt. Learner rates honestly: got it / with hints / not yet (not-yet solves can be redone from the map).
3. Later `solve` steps with **fewer hints** and mixed concepts.
4. Capstone quest: only `solve` steps, plus quiz, mixing everything.

Write hints so the first one is a question, the second names the method, the third gives the next calculation.

## 6. Keeping interest high without noise

- Start every quest with `predict`.
- Alternate: learn screen, then do screen. Quiz questions mid-quest count as "do".
- Vary the shape: lab, flow, compare, decoder, solve. Repetition of the same layout five times dulls attention.
- Make the first screens easy wins.
- Use the `question` and `next_hook` to keep a reason to continue.
- Keep rewards thin (XP, badges, skill line). Do not add decoration that has no information in it.
- Respect Calm mode: nothing essential may depend on animation or sound.

## 7. Check yourself against the source

Before delivering:
- Take the source's table of contents and tick each item against a quest, a glossary entry or a card.
- Read the quests in order as the learner with zero background: is every term defined before use?
- List anything in the source you left out and why.
