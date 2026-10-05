#!/usr/bin/env python3
"""Validate a course.json: hard errors (build would break), the one-direction concept ledger, and teaching-quality warnings.

usage: python validate.py course.json [--strict]
  --strict   treat warnings as errors (use this before handing a course to a learner)
exit code 1 if there are errors.

The concept ledger is what keeps the story linear and forces relearning:
  steps   : "teaches": ["id", ...]  (introduces a concept; each id exactly once in the whole course)
            "needs":   ["id", ...]  (uses a concept; it must have been taught EARLIER: no forward references)
  quiz/cards: "concepts": ["id", ...]  (what the item tests; these are the relearning touchpoints)
"""
import json, os, re, sys

STEP_TYPES = {"predict", "idea", "decode", "worked", "lab", "figure", "dump", "quiz", "cards", "html", "flow", "compare", "solve"}
PASSIVE = {"idea", "decode", "worked", "figure", "flow", "compare", "html"}
FORMULA_HINT = re.compile(r"(?<![A-Za-z])[A-Za-z]\w{0,3}\s*=\s*[^=\s]|\b\w\s*[\^/×·*]\s*\w|[√Σ∫≈≤≥]")
ID = re.compile(r"[A-Za-z][A-Za-z0-9_]*")


def check(c, base="."):
    E, W = [], []
    if not isinstance(c, dict):
        return ["course.json must be an object"], W
    if not c.get("title"):
        E.append("missing top-level 'title'")
    qs = c.get("quests")
    if not isinstance(qs, list) or not qs:
        E.append("'quests' must be a non-empty list")
        return E, W
    if not c.get("glossary"):
        W.append("no 'glossary': learners with no background will meet undefined words (add every term + symbol)")

    seen_q = set()
    intro = {}          # concept id -> (quest idx, position)
    uses = []           # (concept id, quest idx, position, where)
    touch = {}          # concept id -> list of (quest idx, kind)
    any_solve = False
    ledger_used = False

    for qi, q in enumerate(qs):
        P = f"quest {qi + 1} ({q.get('title', '?')})"
        steps = q.get("steps", [])
        quiz = q.get("quiz", [])
        # position of every quiz question = where the engine will show it
        qpos = {}
        auto_at = len(steps) + 1
        for j, z in enumerate(quiz, 1):
            qpos[z.get("id") or f"q{j}"] = auto_at
        for si, s in enumerate(steps, 1):
            if s.get("type") == "quiz":
                for i in s.get("ids", []):
                    qpos[i] = si

        if not q.get("title"):
            E.append(f"{P}: missing title")
        if q.get("id"):
            if q["id"] in seen_q:
                E.append(f"{P}: duplicate id '{q['id']}'")
            seen_q.add(q["id"])
            if not re.fullmatch(r"[A-Za-z0-9_]+", q["id"]):
                E.append(f"{P}: id must be letters/digits/underscore only (it is joined with '-')")
        if not q.get("outcomes"):
            E.append(f"{P}: add 'outcomes' (what the learner can DO after this quest)")
        if not q.get("question"):
            W.append(f"{P}: add a 'question' (the mystery this quest answers; curiosity keeps attention)")
        for cid in q.get("needs", []):
            uses.append((cid, qi, 0, f"{P} 'needs'"))

        qids = set()
        for j, z in enumerate(quiz, 1):
            Z = f"{P} quiz {j}"
            for k in ("q", "answer", "why"):
                if not z.get(k):
                    E.append(f"{Z}: missing '{k}'")
            w = z.get("wrong", [])
            if len(w) not in (2, 3):
                E.append(f"{Z}: 'wrong' needs 2-3 distractors (has {len(w)})")
            if z.get("answer") in w:
                E.append(f"{Z}: the answer also appears in 'wrong'")
            if len(set(map(str, w))) != len(w):
                E.append(f"{Z}: duplicate wrong options")
            zid = z.get("id") or f"q{j}"
            if zid in qids:
                E.append(f"{Z}: duplicate id")
            qids.add(zid)
            if z.get("id") and not re.fullmatch(r"[A-Za-z0-9_]+", z["id"]):
                E.append(f"{Z}: id must be letters/digits/underscore only")
            if z.get("why") and len(z["why"]) < 25:
                W.append(f"{Z}: 'why' is very short; explain why the answer is right AND what the tempting wrong answer gets wrong")
            if z.get("answer") and w and len(str(z["answer"])) > 2 * max(len(str(x)) for x in w) + 20:
                W.append(f"{Z}: correct answer is much longer than the distractors (a giveaway)")
            for cid in z.get("concepts", []):
                ledger_used = True
                uses.append((cid, qi, qpos[zid], f"{Z} 'concepts'"))
                touch.setdefault(cid, []).append((qi, "quiz"))
        if len(quiz) < 3:
            W.append(f"{P}: only {len(quiz)} quiz questions (aim for 5-10: retrieval practice is the point)")

        cards = q.get("cards", [])
        if len(cards) < 3:
            W.append(f"{P}: {len(cards)} flashcards (aim for 5-10; they drive the spaced review)")
        for j, cd in enumerate(cards, 1):
            if not (cd.get("front") or cd.get("f")) or not (cd.get("back") or cd.get("b")):
                E.append(f"{P} card {j}: needs 'front' and 'back'")
            for cid in cd.get("concepts", []):
                ledger_used = True
                uses.append((cid, qi, len(steps) + 2, f"{P} card {j} 'concepts'"))
                touch.setdefault(cid, []).append((qi, "card"))

        if not steps:
            E.append(f"{P}: no steps")
        if len(steps) > 18:
            W.append(f"{P}: {len(steps)} steps; split into two quests (aim for 8-14 screens, ~12 minutes)")
        types = [s.get("type") for s in steps]
        has_decode = "decode" in types
        if steps and types[0] != "predict":
            W.append(f"{P}: start with a 'predict' step (guessing first improves memory)")
        if "dump" not in types:
            W.append(f"{P}: no 'dump' step (a 60-second brain dump is cheap retrieval practice)")
        visual = any(s.get("type") in ("lab", "figure", "flow", "compare") or s.get("viz") or s.get("src") or s.get("svg") for s in steps)
        if not visual:
            W.append(f"{P}: nothing visual (add a lab, flow, compare, figure or an svg viz; the learner should SEE the idea)")
        # pacing: passive streaks lose attention; quiz placement counts as active
        run = 0
        for si, s in enumerate(steps, 1):
            run = run + 1 if s.get("type") in PASSIVE else 0
            if run == 4:
                W.append(f"{P} step {si}: four passive screens in a row; put a predict, quiz question, lab or solve in between (attention drops after ~3)")
        taught_here = 0

        for si, s in enumerate(steps, 1):
            S = f"{P} step {si}"
            t = s.get("type")
            if t not in STEP_TYPES:
                E.append(f"{S}: unknown type '{t}' (use one of {sorted(STEP_TYPES)})")
                continue
            for cid in s.get("teaches", []):
                ledger_used = True
                taught_here += 1
                if not ID.fullmatch(cid):
                    E.append(f"{S}: concept id '{cid}' must be letters/digits/underscore")
                if cid in intro:
                    E.append(f"{S}: concept '{cid}' is taught twice (first in quest {intro[cid][0] + 1}). Teach each idea once; revisit it with 'needs' and quiz 'concepts'")
                else:
                    intro[cid] = (qi, si)
            for cid in s.get("needs", []):
                ledger_used = True
                uses.append((cid, qi, si, f"{S} 'needs'"))
                if t != "quiz":
                    touch.setdefault(cid, []).append((qi, t))
            if t == "idea":
                if not s.get("title"): E.append(f"{S}: idea needs 'title'")
                ls = s.get("lines", [])
                if not ls: E.append(f"{S}: idea needs 'lines'")
                if len(ls) > 6: W.append(f"{S}: {len(ls)} lines; chunk it (max ~5 per screen)")
                for l in ls:
                    if len(l) > 240: W.append(f"{S}: a line is {len(l)} characters; shorten (one thought per line)")
                if not (s.get("analogy") or s.get("example")): W.append(f"{S}: add an 'analogy' or 'example' (abstract rule alone does not stick)")
                if not has_decode and any(FORMULA_HINT.search(re.sub(r"<[^>]+>", "", l)) for l in ls):
                    W.append(f"{S}: looks like a formula in a plain 'idea' and this quest has no 'decode' step; every formula needs a decoder")
            elif t == "decode":
                if not s.get("formula"): E.append(f"{S}: decode needs 'formula'")
                ps = s.get("parts", [])
                if len(ps) < 2: E.append(f"{S}: decode needs 'parts' (one per symbol)")
                for p in ps:
                    for k in ("sym", "name", "plain"):
                        if not p.get(k): E.append(f"{S}: a part is missing '{k}'")
                    if not p.get("effect"): W.append(f"{S}: part '{p.get('sym')}' has no 'effect' (what changes when it changes?)")
                f = s.get("formula", "")
                if ps and "[[" not in f: W.append(f"{S}: color-link the formula to its parts with [[0|x]] markup")
                if f.count("[[") != f.count("]]"): E.append(f"{S}: unbalanced [[ ]] in formula")
            elif t == "worked":
                for k in ("title", "problem", "answer"):
                    if not s.get(k): E.append(f"{S}: worked needs '{k}'")
                if len(s.get("steps", [])) < 2: E.append(f"{S}: worked needs 'steps' (label + work)")
            elif t == "solve":
                any_solve = True
                for k in ("problem", "answer"):
                    if not s.get(k): E.append(f"{S}: solve needs '{k}'")
                if len(s.get("steps", [])) < 2: E.append(f"{S}: solve needs worked 'steps' (shown after the attempt)")
                if len(s.get("hints", [])) < 2: W.append(f"{S}: give 2-3 'hints' that nudge without giving the answer (a hint ladder)")
                if not s.get("needs"): W.append(f"{S}: add 'needs' (which concepts does this problem exercise?)")
            elif t == "flow":
                if len(s.get("nodes", [])) < 2: E.append(f"{S}: flow needs 'nodes' (at least 2: label + sub)")
            elif t == "compare":
                if len(s.get("headers", [])) != 2: E.append(f"{S}: compare needs 'headers': [left, right]")
                if len(s.get("rows", [])) < 2 or any(len(r) != 3 for r in s.get("rows", [])): E.append(f"{S}: compare needs 'rows': [[label, left, right], ...] (at least 2)")
            elif t == "lab":
                cs = s.get("controls", [])
                if not cs: E.append(f"{S}: lab needs 'controls'")
                ids = [x.get("id") for x in cs]
                for x in cs:
                    if not re.fullmatch(r"[A-Za-z_]\w*", str(x.get("id", ""))): E.append(f"{S}: control id '{x.get('id')}' must be a JS identifier")
                    if "min" not in x or "max" not in x: E.append(f"{S}: control '{x.get('id')}' needs min and max")
                    elif not x["min"] < x["max"]: E.append(f"{S}: control '{x.get('id')}' min must be < max")
                    elif "value" in x and not (x["min"] <= x["value"] <= x["max"]): E.append(f"{S}: control '{x.get('id')}' value outside min..max")
                if len(set(ids)) != len(ids): E.append(f"{S}: duplicate control ids")
                if not (s.get("outputs") or s.get("plot") or s.get("svg")): E.append(f"{S}: lab needs at least one of outputs / plot / svg")
                if not s.get("tries"): W.append(f"{S}: add 'tries' (what should the learner do and notice?)")
                if s.get("plot") and not (s["plot"].get("series") and s["plot"].get("x")): E.append(f"{S}: plot needs 'series' and 'x': [min,max]")
            elif t == "predict":
                if not s.get("prompt") or not s.get("answer"): E.append(f"{S}: predict needs 'prompt' and 'answer'")
            elif t == "dump":
                if not s.get("points"): E.append(f"{S}: dump needs 'points' (the checklist)")
            elif t == "figure":
                if not (s.get("src") or s.get("svg")): E.append(f"{S}: figure needs 'src' or 'svg'")
                if s.get("src") and not re.match(r"(data:|https?:)", s["src"]) and not os.path.isfile(os.path.join(base, s["src"])):
                    E.append(f"{S}: image file not found: {s['src']}")
                if not s.get("caption"): W.append(f"{S}: figure without a 'caption' (say what to look at)")
            elif t == "quiz":
                for i in s.get("ids", []):
                    if i not in qids: E.append(f"{S}: quiz id '{i}' not in this quest's quiz")
        if taught_here > 5:
            W.append(f"{P}: teaches {taught_here} new concepts; more than ~5 per quest overloads working memory. Split the quest")

    # ---------- one-direction ledger ----------
    if not ledger_used:
        W.append("no concept ledger ('teaches' / 'needs' / quiz-card 'concepts'): the one-direction line and the relearning are not enforced. Add them")
    for cid, qi, pos, where in uses:
        if cid not in intro:
            E.append(f"{where}: concept '{cid}' is never taught (no step has \"teaches\": [\"{cid}\"])")
        else:
            iq, ip = intro[cid]
            if (qi, pos) < (iq, ip) or (qi, pos) == (iq, ip) and where.endswith("'needs'"):
                E.append(f"{where}: uses concept '{cid}' BEFORE it is taught (quest {iq + 1}, step {ip}). Reorder, or teach it first: the story must run in one direction")
    last_q = len(qs) - 1
    for cid, (iq, ip) in intro.items():
        tp = touch.get(cid, [])
        if len(tp) < 3:
            W.append(f"concept '{cid}': only {len(tp)} relearning touchpoints after it is taught (aim for 3+: quiz questions, cards, worked/lab/solve steps that 'need' it)")
        if iq < last_q and not any(q2 > iq for q2, _ in tp):
            W.append(f"concept '{cid}' (taught in quest {iq + 1}) never comes back in a later quest; spaced relearning across quests needs at least one later touchpoint")
    if not any_solve:
        W.append("no 'solve' steps anywhere: the learner never practises producing answers. End with a capstone quest of solve steps that mix earlier concepts")
    return E, W


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv
    if not args:
        sys.exit(__doc__)
    path = args[0]
    try:
        with open(path, encoding="utf-8") as f:
            course = json.load(f)
    except Exception as ex:
        sys.exit(f"cannot read {path}: {ex}")
    e, w = check(course, os.path.dirname(os.path.abspath(path)))
    for x in w: print("warn :", x)
    for x in e: print("ERROR:", x)
    print(f"{len(e)} error(s), {len(w)} warning(s)")
    sys.exit(1 if e or (strict and w) else 0)
