// maps.js — our own drawings of the Transformer and of today's LLMs, with parts lit up.
// Used by the lessons of this course: a small map on a page (<div class="tfmini" data-lit="…">),
// or drawn by a page's own script with tfDraw / llmDraw.
(function () {
  const st = document.createElement("style");
  st.textContent = `
  /* ---- The Transformer map (our own drawing) ---- */
  .tfmap { width: 100%; display: block; }
  .tfmap .bx { fill: var(--note-blue); stroke: var(--ink); stroke-width: 1.2; transition: stroke .3s, stroke-width .3s; }
  .tfmap .bx.y { fill: var(--note-yellow); } .tfmap .bx.g { fill: var(--note-green); } .tfmap .bx.p { fill: var(--note-pink); }
  .tfmap .bx.o { fill: var(--note-orange); } .tfmap .bx.w { fill: var(--card); } .tfmap .bx.b { fill: var(--note-blue); }
  .tfmap .bt { font-family: var(--body); font-size: 11.5px; text-anchor: middle; fill: var(--ink); pointer-events: none; }
  .tfmap .tm { font-family: var(--mono); font-size: 11px; text-anchor: middle; fill: var(--ink); }
  .tfmap .ts { font-family: var(--hand); font-size: 12px; fill: var(--pencil); }
  .tfmap .nx { font-family: var(--head); font-size: 16px; fill: var(--pencil); }
  .tfmap .frame { fill: none; stroke: var(--pencil); stroke-width: 1.2; stroke-dasharray: 5 4; }
  .tfmap .ar { stroke: var(--pen); stroke-width: 1.6; fill: none; }
  .tfmap .skip { stroke: var(--pencil); stroke-width: 1.2; fill: none; stroke-dasharray: 3 3; }
  .tfmap .plus { fill: var(--card); stroke: var(--ink); stroke-width: 1.2; } .tfmap .pl { stroke: var(--ink); stroke-width: 1.5; }
  .tfmap .faded { opacity: .38; }
  #tfBig .tfmap .faded { opacity: .16; }
  .tfmap g, .tfmap path, .tfmap text, .tfmap rect, .tfmap circle { transition: opacity .45s; }
  .tfmap .lit .bx, .tfmap rect.lit { stroke: var(--redpen); stroke-width: 2.6; }
  .tfmap .skip:not(.faded) { stroke: var(--redpen); }
  .tfmap .blk { cursor: pointer; }
  .tfmap .blk:hover .bx, .tfmap .blk:focus-visible .bx { stroke: var(--pen); stroke-width: 2.6; }
  .tfmap .flow { stroke: var(--redpen); stroke-width: 2.4; stroke-dasharray: 7 5; animation: tfflow 0.9s linear infinite; }
  @keyframes tfflow { to { stroke-dashoffset: -24; } }
  @media (prefers-reduced-motion: reduce) { .tfmap .flow { animation: none; } }
  .tfmini { float: right; width: 180px; margin: -6px 0 6px 18px; }
  .tfmini[data-map="llm"] { width: 138px; }
  .tfmini ~ .activity, .tfmini ~ .cards, .tfmini ~ .quiz, .tfmini ~ .eq { clear: both; }
  .tfbig { display: grid; grid-template-columns: minmax(0, 290px) 1fr; gap: 18px; align-items: center; }
  .tfbig .note { margin: 0; }
  @media (max-width: 640px) {
    .tfmini { width: 128px; margin-left: 10px; }
    .tfmini[data-map="llm"] { width: 100px; }
    .tfbig { grid-template-columns: 1fr; }
    .tfbig #tfBig { max-width: 300px; margin: 0 auto; }
  }
  .tfmap .bs { font-family: var(--mono); font-size: 8.5px; text-anchor: middle; fill: var(--pencil); pointer-events: none; }
  .tfmap .blk.nogo { cursor: default; }
`;
  document.head.appendChild(st);
})();
const tfReduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- The Transformer map: our own drawing of the whole model, with parts lit up ----------
// <div class="tfmini" data-lit="enc-att,enc-ff"></div> draws a small map; clicking a block opens its page.
const TF_BLOCKS = [
  // key, label, x, y, w, h, colour class, page it is taught on
  ["enc-emb", "Input embedding", 20, 452, 140, 26, "y", "Encoder input: embeddings"],
  ["dec-emb", "Output embedding", 200, 452, 140, 26, "y", "The decoder"],
  ["enc-att", "Multi-head attention", 30, 370, 120, 26, "p", "Inside the encoder"],
  ["enc-an1", "Add & Norm", 30, 344, 120, 18, "w", "Tricks: residuals and layer norm"],
  ["enc-ff", "Feed forward", 30, 300, 120, 26, "g", "Inside the encoder"],
  ["enc-an2", "Add & Norm", 30, 274, 120, 18, "w", "Tricks: residuals and layer norm"],
  ["dec-matt", "Masked multi-head att.", 210, 370, 120, 26, "p", "Trick: masking"],
  ["dec-an1", "Add & Norm", 210, 344, 120, 18, "w", "Tricks: residuals and layer norm"],
  ["dec-xatt", "Encoder–decoder att.", 210, 300, 120, 26, "o", "The decoder"],
  ["dec-an2", "Add & Norm", 210, 274, 120, 18, "w", "Tricks: residuals and layer norm"],
  ["dec-ff", "Feed forward", 210, 230, 120, 26, "g", "The decoder"],
  ["dec-an3", "Add & Norm", 210, 204, 120, 18, "w", "Tricks: residuals and layer norm"],
  ["linear", "Linear", 210, 150, 120, 24, "b", "Picking the next word"],
  ["softmax", "Softmax", 210, 114, 120, 24, "b", "Picking the next word"],
];
const TF_SAY = {
  "in-tok": "<b>Inputs:</b> the English sentence, cut into tokens.",
  "enc-emb": "<b>Input embedding:</b> each token looks up its own row of 512 learned numbers.",
  "enc-pos": "<b>Position vectors</b> are added, so each token also says where it is.",
  "enc-att": "<b>Self-attention</b> (8 heads): each English token mixes in the tokens it needs.",
  "enc-ff": "<b>Feed forward:</b> each token thinks it over on its own.",
  "enc-an1": "<b>Add & Norm:</b> keep the input (residual), and keep the numbers a steady size.",
  "enc-an2": "<b>Add & Norm:</b> keep the input (residual), and keep the numbers a steady size.",
  "enc-stack": "<b>×6:</b> the encoder's layers are repeated 6 times. Out come context-aware embeddings.",
  "out-tok": "<b>Outputs so far:</b> the French written up to now, starting with [BOS].",
  "dec-emb": "<b>Output embedding:</b> each French token gets its own learned row.",
  "dec-pos": "<b>Position vectors</b> are added to the French tokens too.",
  "dec-matt": "<b>Masked self-attention:</b> each French token looks only at the French before it.",
  "dec-xatt": "<b>Encoder–decoder attention:</b> the French asks (queries); the English answers (keys and values).",
  "dec-ff": "<b>Feed forward:</b> each token thinks it over, as in the encoder.",
  "dec-an1": "<b>Add & Norm</b>, after every layer of the decoder too.",
  "dec-an2": "<b>Add & Norm</b>, after every layer of the decoder too.",
  "dec-an3": "<b>Add & Norm</b>, after every layer of the decoder too.",
  "dec-stack": "<b>×6:</b> the decoder's layers are repeated 6 times as well.",
  "linear": "<b>Linear:</b> the top vector gets one score for every token in the vocabulary.",
  "softmax": "<b>Softmax:</b> the scores become chances. We pick the next token.",
  "out": "<b>Output chances</b> for the next French token.",
  "enc-link": "The encoder's output goes into <b>every</b> encoder–decoder attention layer.",
};
const TF_GROUPS = { res: ["enc-an1", "enc-an2", "dec-an1", "dec-an2", "dec-an3", "skip"], "enc-stack": ["enc-att", "enc-an1", "enc-ff", "enc-an2", "enc-stack"], "dec-stack": ["dec-matt", "dec-an1", "dec-xatt", "dec-an2", "dec-ff", "dec-an3", "dec-stack"] };
function tfLitSet(list) {
  const s = new Set();
  list.forEach(k => { s.add(k); (TF_GROUPS[k] || []).forEach(x => s.add(x)); });
  return s;
}
function tfMapSVG(lit, opts = {}) {
  const on = k => !lit.size || lit.has(k);
  const fade = k => on(k) ? (lit.size && !opts.plain ? "lit" : "") : "faded";
  const id = opts.id || "tfm";
  let s = `<defs><marker id="${id}H" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--pen)"/></marker></defs>`;
  const arrow = (d, k) => `<path d="${d}" class="ar ${on(k) ? "" : "faded"}" style="marker-end:url(#${id}H)"/>`;
  // stack frames
  s += `<rect x="18" y="262" width="144" height="146" rx="10" class="frame ${fade("enc-stack")}"/><text x="10" y="340" class="nx ${fade("enc-stack")}" text-anchor="end">6×</text>`;
  s += `<rect x="198" y="192" width="144" height="216" rx="10" class="frame ${fade("dec-stack")}"/><text x="350" y="305" class="nx ${fade("dec-stack")}">×6</text>`;
  // inputs and outputs
  s += `<text x="90" y="510" class="tm ${fade("in-tok")}">Inputs (English)</text><text x="270" y="510" class="tm ${fade("out-tok")}">Outputs so far (French)</text>`;
  s += arrow("M90,496 L90,481", "enc-emb") + arrow("M270,496 L270,481", "dec-emb");
  s += `<text x="270" y="86" class="tm ${fade("out")}">Output chances</text>` + arrow("M270,112 L270,92", "out");
  // position ⊕
  [["enc-pos", 90], ["dec-pos", 270]].forEach(([k, x]) => {
    s += `<circle cx="${x}" cy="430" r="9" class="plus ${fade(k)}"/><path d="M${x - 5},430 h10 M${x},425 v10" class="pl ${fade(k)}"/>` +
      `<text x="${x + (x < 180 ? -14 : 14)}" y="434" class="ts ${fade(k)}" text-anchor="${x < 180 ? "end" : "start"}">position</text>`;
    s += arrow(`M${x},451 L${x},441`, k) + arrow(`M${x},420 L${x},398`, k);
  });
  // blocks
  TF_BLOCKS.forEach(([k, label, x, y, w, h, c]) => {
    s += `<g class="blk ${fade(k)}" data-k="${k}" tabindex="0" role="button" aria-label="${label}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="bx ${c}"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" class="bt">${label}</text></g>`;
  });
  // arrows between blocks
  s += arrow("M90,370 L90,364", "enc-an1") + arrow("M90,344 L90,328", "enc-ff") + arrow("M90,300 L90,294", "enc-an2");
  s += arrow("M270,370 L270,364", "dec-an1") + arrow("M270,344 L270,328", "dec-xatt") + arrow("M270,300 L270,294", "dec-an2") + arrow("M270,274 L270,258", "dec-ff") + arrow("M270,230 L270,224", "dec-an3") + arrow("M270,204 L270,176", "linear") + arrow("M270,150 L270,140", "softmax");
  // residual skips
  const sk = on("skip") ? "skip" : "skip faded";
  [[30, 404, 353], [30, 334, 283]].forEach(([x, y1, y2]) => s += `<path d="M${x + 60},${y1} h-66 V${y2} h6" class="${sk}"/>`);
  [[210, 404, 353], [210, 334, 283], [210, 264, 213]].forEach(([x, y1, y2]) => s += `<path d="M${x + 60},${y1} h-66 V${y2} h6" class="${sk}"/>`);
  // encoder → decoder
  s += `<path d="M90,262 L90,250 L180,250 L180,313 L206,313" class="ar ${on("enc-link") || on("dec-xatt") ? "" : "faded"} ${lit.has("enc-link") ? "flow" : ""}" style="marker-end:url(#${id}H)"/>`;
  return s;
}
function tfPageOf(k) { const b = TF_BLOCKS.find(x => x[0] === k); return b && b[7]; }
function tfGoTo(title) {
  const parts = [...document.querySelectorAll("section.part")], i = parts.findIndex(p => p.dataset.title === title);
  if (i >= 0) location.hash = "#" + (i + 1);
}
// Draw a map into el. If the same map is already there, only change classes, so parts fade in and out smoothly.
function mapRender(el, html, sig) {
  const old = el.querySelector("svg.tfmap");
  if (old && el.dataset.sig === sig) {
    const t = document.createElement("div"); t.innerHTML = html;
    const nu = t.firstElementChild, a = [...old.querySelectorAll("*")], b = [...nu.querySelectorAll("*")];
    if (a.length === b.length) {
      a.forEach((x, i) => { const c = b[i].getAttribute("class"); if (c !== x.getAttribute("class")) c == null ? x.removeAttribute("class") : x.setAttribute("class", c); });
      old.setAttribute("aria-label", nu.getAttribute("aria-label"));
      return;
    }
  }
  el.innerHTML = html; el.dataset.sig = sig;
}
function tfDraw(el, keys, opts = {}) {
  const lit = tfLitSet(keys);
  (opts.drop || []).forEach(k => lit.delete(k));
  mapRender(el, `<svg class="tfmap" viewBox="0 72 360 446" role="img" aria-label="The Transformer: encoder on the left, decoder on the right${keys.length ? "; lit up: " + keys.join(", ") : ""}">${tfMapSVG(lit, opts)}</svg>`, "tf");
  el.querySelectorAll(".blk").forEach(g => {
    const go = () => opts.onPick ? opts.onPick(g.dataset.k) : tfPageOf(g.dataset.k) && tfGoTo(tfPageOf(g.dataset.k));
    g.onclick = go; g.onkeydown = e => { if (e.key === "Enter") go(); };
  });
}

// ---------- Today's LLM map: a decoder-only Transformer, as built in 2017 or today ----------
// <div class="tfmini" data-map="llm" data-variant="today" data-lit="att"></div>
// Keys: in-tok, emb, pos, norm1, att, add1, norm2, ffn, add2, an1, an2, fnorm, linear, softmax, out, stack, skip
function llmMapSVG(lit, opts = {}) {
  const v = opts.variant || "today", today = v === "today";
  const on = k => !lit.size || lit.has(k);
  const cls = k => on(k) ? (lit.size && !opts.plain ? "lit" : "") : "faded";
  const id = opts.id || "llm";
  let s = `<defs><marker id="${id}H" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--pen)"/></marker></defs>`;
  const ar = (d, k) => `<path d="${d}" class="ar ${on(k) ? "" : "faded"}" style="marker-end:url(#${id}H)"/>`;
  const blk = (k, label, sub, y, h, c, x = 70, w = 160) => `<g class="blk ${cls(k)}" data-k="${k}" tabindex="0" role="button" aria-label="${label}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="bx ${c}"/>` +
    (sub ? `<text x="${x + w / 2}" y="${y + h / 2 - 1}" class="bt">${label}</text><text x="${x + w / 2}" y="${y + h / 2 + 10}" class="bs">${sub}</text>` : `<text x="${x + w / 2}" y="${y + h / 2 + 4}" class="bt">${label}</text>`) + `</g>`;
  const plus = (k, cy) => `<circle cx="150" cy="${cy}" r="8" class="plus ${on(k) ? "" : "faded"}"/><path d="M145,${cy} h10 M150,${cy - 5} v10" class="pl ${on(k) ? "" : "faded"}"/>`;
  s += `<text x="150" y="486" class="tm ${cls("in-tok")}">Tokens so far</text>` + ar("M150,474 L150,458", "emb");
  s += blk("emb", "Token embedding", "", 432, 24, "y");
  s += `<rect x="58" y="190" width="184" height="216" rx="10" class="frame ${cls("stack")}"/><text x="250" y="300" class="nx ${cls("stack")}">×N</text>`;
  if (today) {
    s += ar("M150,432 L150,402", "norm1");
    s += blk("norm1", "RMSNorm", "", 382, 18, "w");
    s += ar("M150,382 L150,368", "att");
    s += blk("att", "Masked self-attention", "RoPE · GQA", 336, 30, "p");
    s += ar("M150,336 L150,326", "add1") + plus("add1", 316);
    s += ar("M150,308 L150,296", "norm2");
    s += blk("norm2", "RMSNorm", "", 276, 18, "w");
    s += ar("M150,276 L150,262", "ffn");
    s += blk("ffn", "Feed forward", "MoE: a few experts per token", 230, 30, "g");
    s += ar("M150,230 L150,220", "add2") + plus("add2", 210);
    const sk = on("skip") ? "skip" : "skip faded";
    s += `<path d="M150,416 H48 V316 H140" class="${sk}"/><path d="M150,302 H48 V210 H140" class="${sk}"/>`;
    s += ar("M150,202 L150,178", "fnorm");
    s += blk("fnorm", "RMSNorm", "", 158, 18, "w");
    s += ar("M150,158 L150,146", "linear");
  } else {
    s += `<circle cx="150" cy="418" r="8" class="plus ${on("pos") ? "" : "faded"}"/><path d="M145,418 h10 M150,413 v10" class="pl ${on("pos") ? "" : "faded"}"/><text x="164" y="422" class="ts ${cls("pos")}">position vectors</text>`;
    s += ar("M150,410 L150,390", "att");
    s += blk("att", "Masked self-attention", "8 heads, each its own K, V", 358, 30, "p");
    s += ar("M150,358 L150,348", "an1");
    s += blk("an1", "Add & LayerNorm", "", 328, 18, "w");
    s += ar("M150,328 L150,306", "ffn");
    s += blk("ffn", "Feed forward", "dense: all of it runs", 274, 30, "g");
    s += ar("M150,274 L150,264", "an2");
    s += blk("an2", "Add & LayerNorm", "", 244, 18, "w");
    const sk = on("skip") ? "skip" : "skip faded";
    s += `<path d="M150,398 H48 V337 H70" class="${sk}"/><path d="M150,314 H48 V253 H70" class="${sk}"/>`;
    s += ar("M150,244 L150,146", "linear");
  }
  s += blk("linear", "Linear", "", 122, 22, "b");
  s += ar("M150,122 L150,110", "softmax");
  s += blk("softmax", "Softmax", "", 86, 22, "b");
  s += ar("M150,86 L150,70", "out") + `<text x="150" y="62" class="tm ${cls("out")}">Next-token chances</text>`;
  return s;
}
function llmDraw(el, keys, opts = {}) {
  const lit = tfLitSet(keys);
  (opts.drop || []).forEach(k => lit.delete(k));
  mapRender(el, `<svg class="tfmap" viewBox="30 48 240 448" role="img" aria-label="A decoder-only LLM, as built ${opts.variant === "2017" ? "in 2017" : "today"}${keys.length ? "; lit up: " + keys.join(", ") : ""}">${llmMapSVG(lit, opts)}</svg>`, "llm-" + (opts.variant || "today"));
  el.querySelectorAll(".blk").forEach(g => {
    const page = (window.LLM_PAGES || {})[g.dataset.k];
    const go = () => opts.onPick ? opts.onPick(g.dataset.k) : page && tfGoTo(page);
    if (!page && !opts.onPick) g.classList.add("nogo");
    g.onclick = go; g.onkeydown = e => { if (e.key === "Enter") go(); };
  });
}

// Draw every small map on the page (after the page's own script, which may set LLM_PAGES)
const tfDrawMinis = () => document.querySelectorAll(".tfmini[data-lit]").forEach((el, i) => {
  const keys = (el.dataset.lit || "").split(",").filter(Boolean);
  if (el.dataset.map === "llm") llmDraw(el, keys, { id: "llmm" + i, variant: el.dataset.variant || "today" });
  else tfDraw(el, keys, { id: "tfm" + i });
});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tfDrawMinis); else tfDrawMinis();

// ---------- Training stages: a slim bar under a page's title, with the current stage lit ----------
// <div class="stagemap" data-stage="sft"></div>   Clicking a stage opens its first page (window.STAGE_PAGES).
const STAGES = [["pre", "Pretraining"], ["mid", "Midtraining"], ["sft", "Fine-tuning"], ["pref", "Preference tuning"], ["reason", "Reasoning"], ["distill", "Distillation"]];
(function () {
  const st = document.createElement("style");
  st.textContent = `
  .stagemap { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: -4px 0 12px; font-size: 0.78rem; }
  .stagemap .sg { padding: 1px 8px; border: 1.2px solid var(--rule); border-radius: 10px; color: var(--pencil); background: transparent; cursor: pointer; font: inherit; line-height: 1.5; }
  .stagemap .sg.now { border-color: var(--ink); background: var(--note-yellow); color: var(--ink); font-weight: 700; }
  .stagemap .sg.past { color: var(--ink); }
  .stagemap .ar { color: var(--pencil); }
  @media (max-width: 640px) { .stagemap .sg:not(.now) { font-size: 0; padding: 0; width: 9px; height: 9px; border-radius: 50%; } .stagemap .sg.past { background: var(--pencil); } .stagemap .ar { display: none; } }
  `;
  document.head.appendChild(st);
})();
function stageDraw() {
  document.querySelectorAll(".stagemap[data-stage]").forEach(el => {
    const now = el.dataset.stage.split(","), first = STAGES.findIndex(s => now.includes(s[0]));
    el.setAttribute("aria-label", "Training stages; this page: " + STAGES.filter(s => now.includes(s[0])).map(s => s[1]).join(", "));
    el.innerHTML = STAGES.map(([k, name], i) => `<button type="button" class="sg ${now.includes(k) ? "now" : i < first ? "past" : ""}" data-k="${k}" title="${name}">${name}</button>`).join('<span class="ar">→</span>');
    el.querySelectorAll(".sg").forEach(b => b.onclick = () => { const p = (window.STAGE_PAGES || {})[b.dataset.k]; if (p) tfGoTo(p); });
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", stageDraw); else stageDraw();
