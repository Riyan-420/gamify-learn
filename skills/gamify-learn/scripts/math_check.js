// Used by math_check.py. Reads {"tex":[{loc,tex,display}],"expr":[{loc,expr,names}]} on stdin, prints a JSON list of problems.
// The macro list below must match mathMacros() in assets/engine/engine.js (the colour macros only need to parse here).
const fs = require("fs"), path = require("path");
const katex = require(path.join(__dirname, "..", "assets", "katex", "katex.min.js"));

const macros = {"\\hl": "\\colorbox{fff0a8}{$#1$}"};
"ABCDEF".split("").forEach(L => { macros["\\c" + L] = "\\textcolor{12213f}{#1}"; });
const sh = {R: "\\mathbb{R}", N: "\\mathbb{N}", Z: "\\mathbb{Z}", Q: "\\mathbb{Q}", C: "\\mathbb{C}", E: "\\mathbb{E}", T: "^{\\top}", inv: "^{-1}", dd: "\\,\\mathrm{d}", given: "\\mid",
  abs: "\\left|#1\\right|", norm: "\\left\\lVert #1\\right\\rVert", set: "\\left\\{#1\\right\\}", ip: "\\left\\langle #1,#2\\right\\rangle",
  dv: "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}", pdv: "\\frac{\\partial #1}{\\partial #2}", eval: "\\left.#1\\right|_{#2}", vect: "\\mathbf{#1}",
  Var: "\\operatorname{Var}", Cov: "\\operatorname{Cov}", tr: "\\operatorname{tr}", rank: "\\operatorname{rank}", diag: "\\operatorname{diag}", sign: "\\operatorname{sign}",
  argmax: "\\operatorname*{arg\\,max}", argmin: "\\operatorname*{arg\\,min}"};
Object.keys(sh).forEach(k => { macros["\\" + k] = sh[k]; });

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const out = [];
for (const it of input.tex || []) {
  try {
    katex.renderToString(it.tex, {displayMode: !!it.display, throwOnError: true, strict: false, output: "html", macros: Object.assign({}, macros)});
  } catch (e) {
    out.push({loc: it.loc, kind: "tex", tex: it.tex.slice(0, 80), error: String(e.message || e).replace(/^KaTeX parse error: /, "").slice(0, 160)});
  }
}
const MATHN = Object.getOwnPropertyNames(Math);
for (const it of input.expr || []) {
  try {
    const names = it.names, extra = MATHN.filter(n => !names.includes(n));
    const f = new Function(...names, ...extra, "return (" + it.expr + ")");
    let finite = 0;
    for (let i = 0; i <= 40; i++) {
      const args = names.map((n, k) => (k === 0 ? it.lo + (it.hi - it.lo) * i / 40 : (it.vals && it.vals[n] != null ? it.vals[n] : 1)));
      const v = f(...args, ...extra.map(n => Math[n]));
      if (typeof v === "number" && isFinite(v)) finite++;
    }
    if (!finite) out.push({loc: it.loc, kind: "expr", tex: it.expr, error: "never gives a finite number between " + it.lo + " and " + it.hi});
  } catch (e) {
    out.push({loc: it.loc, kind: "expr", tex: it.expr, error: "JavaScript cannot read it: " + String(e.message || e).slice(0, 100)});
  }
}
process.stdout.write(JSON.stringify(out));
