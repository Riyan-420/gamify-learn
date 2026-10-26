# Teaching maths to a complete beginner (V1.5)

Use this whenever a lesson contains a formula, a matrix, a derivation or a calculation. It is the rule set behind the `$...$` maths, the `why` field on worked steps and the `intuition` / `shortcut` / `check` boxes. The validator warns when maths is written as plain text (`x^2`, `sqrt(`, `[1 0; 0 1]`) or when worked steps have no `why`.

## What the research says (and what we do about it)

| Finding | Source | Rule here |
|---|---|---|
| Novices learn faster from fully **worked examples** than from solving problems; unguided problem solving overloads working memory. | Sweller and Cooper 1985; Cognitive Load Theory (NSW CESE 2017 summary) | Show every step. Never skip a line of rough work. Solve steps come AFTER a worked example. |
| Examples work best in **sequences** (a second, harder example helps transfer) and with **small gaps** between steps. | Renkl; Reed and Bolstad; Pillay | At least two worked examples per formula: a tiny one, then a realistic one. One new thing per step. |
| **Fading**: remove steps gradually until the learner solves alone. | Renkl, Atkinson and Grosse 2004 | worked (all steps) -> solve with hints (last step hidden in the hint ladder) -> capstone. |
| **Split attention**: text and diagram that must be mentally joined cost extra load. | Chandler and Sweller 1992 | The picture, the matrix and the sentence that explains it sit on the same screen. Use colours to link them. |
| **Self-explanation** (asking WHY each step) improves procedural knowledge, conceptual knowledge and transfer; scaffolded prompts beat open ones; explain why wrong ideas are wrong. | Chi 1989; Rittle-Johnson et al. 2017 meta-analysis | Every worked step has a `why`. Every formula has a `trap` that says what the common wrong move is and why it fails. `predict` steps ask before telling. |
| **Concreteness fading**: concrete numbers or a picture first, then an intermediate diagram, then the symbols, and say explicitly how each stage maps to the previous one. | Fyfe, McNeil, Son and Goldstone 2014; Fyfe and Nathan 2019 | Order: real-world problem -> numbers -> picture -> general formula -> decoded symbols. Say "this letter is the 64 from before". |
| **Expertise reversal**: heavy step-by-step support helps novices and hurts experts. | Kalyuga | These decks assume zero knowledge, so full steps; later quests may fade them. |
| Understanding of **concepts and procedures grow together**; explain the principle, not only the recipe. | Rittle-Johnson and Alibali | Each formula gets an `intuition` box (what it is doing, in words and pictures) before the algebra. |
| Intuition first, symbols second; diagrams and analogies are not a crutch; show the "pencil" rough work, not only the "ink". | Better Explained (ADEPT: Analogy, Diagram, Example, Plain English, Technical definition); 3Blue1Brown | Start with the cat, not its DNA. For matrices: columns are where the basis vectors land. |
| ADHD: chunk, colour-code, use visuals, keep steps short, give immediate feedback. | HelpGuide, classroom guidance | One idea per screen, colour = same symbol everywhere, check yourself often. |
| A short **self-explanation training** booklet (focus on the logical links between proof lines) improved proof comprehension in 3 experiments. | Hodds, Alcock and Inglis 2014, J. Research in Mathematics Education 45(1) | `proof` step: a one-sentence `plan`, then every line carries its REASON. |
| Analysing **solved problems**, including incorrect ones, and comparing alternative strategies is recommended for algebra; evidence level "minimal" for solved problems and structure, "moderate" for choosing between strategies. | IES What Works Clearinghouse practice guide, Teaching Strategies for Improving Algebra Knowledge (revised 2018) | `spot` step (find the planted mistake), `compare` step with two valid strategies and a verdict on which is shorter and why. |
| **Spacing** helped maths learning in a 2025 meta-analysis; retrieval practice alone is not yet robust in maths studies (worked examples then retrieval later gave better delayed retention in one comparison). Interleaving mixed problem types is being trialled in maths (IES-funded efficacy study); we do not claim a number. | Murray et al. 2025, Educational Psychology Review; IES interleaved-practice project | Warm-ups and the capstone quest MIX topics, so the learner must choose the method before computing. Teach with worked examples first, quiz after. |

Honest limits: these are mostly school-age studies; effects on adult beginners or on ADHD are inferred, not measured. The rules below are good practice built on them, not a guarantee.

## The recipe for any formula (one quest section)

1. **Problem first.** What are we trying to compute, with a real number or a picture? (predict step)
2. **Concrete case.** Do it with small numbers by hand, in a picture or table, before any letters.
3. **Generalise.** Write the formula typeset (`$$...$$`), with `\cA{}`..`\cF{}` colours linking each symbol to its card in the decode step.
4. **Decode every symbol,** including constants like `c`, `alpha`, `1/N`: what it means, where its value comes from, what happens if it changes (the `effect` line). Say units and allowed range.
5. **Worked example, no skipped steps.** Each step: label (what we do), working (typeset), `why` (the reason in plain words). Show intermediate results ("rough work"): the division, then the power, then the product.
6. **Second, harder example** (different numbers or one more twist).
7. **Check and shortcut.** `check`: a sanity test (does the answer fall in the allowed range, does a special case work?). `shortcut`: a quick rule that avoids the full calculation, when one exists.
8. **Trap.** The common wrong move and why it fails.
9. **Practise.** `solve` with a hint ladder, then quiz and cards.

## Matrices

* Always typeset: `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` (or `bmatrix`). Never `[0 0 1; 2 5 1]`.
* Teach in this order: what the matrix DOES to a point (picture), columns = where the unit steps (basis vectors) land, then the arithmetic.
* Multiplication: show the row-times-column for **every** entry once, colour the row and the column being used (`\cA{}`, `\cB{}`), then the result matrix.
* Composition: the matrix applied FIRST is written LAST (closest to the vector). Say it aloud and show it with a numeric example.
* Homogeneous coordinates: the extra 1 is what lets translation (an add) become a multiply.

## Writing rules

* Write powers as powers (`$r^{\gamma}$`), fractions as fractions (`$\frac{r}{255}$`), products as `\times` or `\cdot`, not the letter x.
* Name every variable the first time it appears, and keep the same letter and colour for it everywhere.
* Put the numbers into the formula in the SAME shape as the formula: `$s = 255\left(\frac{64}{255}\right)^{0.5}$`, then evaluate pieces one by one.
* Give ranges and units: `$r\in[0,255]$`, pixels, millimetres, radians.
* After a result, say what it means for the picture.

## Pick the step type for the kind of maths (V1.5)

| The learner must... | Use | How |
|---|---|---|
| compute a number | `worked` then `solve` | label + working + WHY for every line; a second, harder example; check and shortcut |
| understand a formula | `decode` | colour each symbol (`\cA{}`..`\cF{}`), card per symbol with name, plain meaning, effect of raising it |
| see how a parameter acts | `lab` | sliders; `svg` with `{{expr}}` for geometry (a matrix moving the unit square); outputs with formulas as labels |
| see a function, a limit, an area | `graph` | build in stages: curve, then point, then secants closing in on the tangent, then the answer; one caption per stage |
| follow an argument | `proof` | `plan` (idea in one sentence), then lines with a REASON each; pick the kind (cases, induction, ...) so the learner knows the shape |
| catch the usual error | `spot` | plant the classic mistake (bracket not distributed, transpose order, adding fractions across); the wrong line must look natural |
| choose between methods | `compare` | same problem, two correct strategies, a verdict row (which is shorter and why) |

## Recipes by area

* **Algebra:** the scale / balance picture first; `\hl{-4}` highlights the thing done to both sides; always check by substituting into the ORIGINAL equation.
* **Functions and graphs:** draw the picture before the formula; name the parts that can be read off the curve (roots, vertex, intercept); give each part its own stage and caption.
* **Calculus:** derivative = what the secant slopes settle on (stages: far point, nearer, nearest, tangent). Integral = rectangles getting thinner (`shades` with `n`). Do the limit definition once by hand, then the shortcut rule, and say the rule is the pattern of the hand calculation.
* **Linear algebra:** columns = where the unit steps land (lab with a moving square), then entry-by-entry products, then determinant = area scale, then inverse; size-check every identity.
* **Probability and statistics:** natural frequencies (out of 1000 people) before Bayes' formula; show the formula after the count, not before; the bell curve with shaded 68% and 95%.
* **Proofs:** say what the proof is going to do (plan), state which kind it is, give each line its reason, end by saying why the claim is now shown. Teach induction as dominoes: base case = the first falls, step = each knocks over the next.
* **Discrete maths and counting:** small cases by listing first; then the formula; `\binom{n}{k}`, `\cancel{}` to show what cancels.
* **Units and applications:** put numbers with units into the formula in the same shape, and say what the answer means in the real situation.

## Before you ship

Run `python scripts/validate.py course.json --strict` (it pre-renders every formula in KaTeX when Node.js is installed), build, `python scripts/smoke_test.py`, then look at a `graph`, a `proof`, a `spot` and a phone-width screen of the built game. See `examples/math-showcase/`.
