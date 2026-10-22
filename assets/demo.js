// demo.js — "Follow one sentence through an LLM" on the home page.
// It uses Neo, the small Transformer students build in "Build a Tiny LLM"
// (4 layers, 4 attention heads, reads letter by letter, trained on Grimm's Fairy Tales).
// Steps 1–3 show Neo's REAL tokens, attention and guesses. Steps 4–5 use Neo's real writing
// to illustrate ideas a tiny model can't really do (preference tuning, tool calling).

const NEO_HOME = "https://mo-ri-ch.github.io/build-an-llm-from-scratch/assets/";

if (typeof softmax === "undefined") {
  window.softmax = function (scores) {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const total = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / total);
  };
}

function loadScript(src) {
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
}

(async function demo() {
  const box = document.getElementById("journey");
  if (!box) return;
  const status = box.querySelector("[data-status]");

  // ---------- Load Neo ----------
  let neo;
  try {
    await loadScript(NEO_HOME + "finalmodel.js");
    // Same model, but it also remembers how much the newest letter looked at each earlier letter
    class NeoLens extends FinalModel {
      step(id) {
        const { C, H, L } = this, d = C / H;
        const tok = this.w["tok.weight"], pos = this.w["pos.weight"];
        let x = new Float32Array(C);
        for (let i = 0; i < C; i++) x[i] = tok[id * C + i] + pos[this.pos * C + i];
        this.attn = [];
        for (let l = 0; l < L; l++) {
          const p = `blocks.${l}.`;
          if (!this.cache[l]) this.cache[l] = { k: [], v: [] };
          const qkv = this.linear(this.layerNorm(x, p + "ln1"), p + "qkv");
          const q = qkv.subarray(0, C), k = qkv.slice(C, 2 * C), v = qkv.slice(2 * C);
          this.cache[l].k.push(k); this.cache[l].v.push(v);
          const K = this.cache[l].k, Vv = this.cache[l].v, y = new Float32Array(C);
          const avg = new Float32Array(K.length);
          for (let h = 0; h < H; h++) {
            const o = h * d, scores = new Float32Array(K.length);
            let max = -Infinity;
            for (let t = 0; t < K.length; t++) {
              let s = 0; for (let j = 0; j < d; j++) s += q[o + j] * K[t][o + j];
              scores[t] = s / Math.sqrt(d); if (scores[t] > max) max = scores[t];
            }
            let sum = 0; for (let t = 0; t < K.length; t++) { scores[t] = Math.exp(scores[t] - max); sum += scores[t]; }
            for (let t = 0; t < K.length; t++) {
              const a = scores[t] / sum;
              avg[t] += a / H;
              for (let j = 0; j < d; j++) y[o + j] += a * Vv[t][o + j];
            }
          }
          this.attn.push(avg);
          const att = this.linear(y, p + "proj");
          for (let i = 0; i < C; i++) x[i] += att[i];
          const f = this.linear(this.layerNorm(x, p + "ln2"), p + "fc1");
          for (let i = 0; i < f.length; i++) f[i] = FinalModel.gelu(f[i]);
          const m = this.linear(f, p + "fc2");
          for (let i = 0; i < C; i++) x[i] += m[i];
        }
        this.pos++;
        const logits = this.linear(this.layerNorm(x, "ln"), "head");
        return softmax(Array.from(logits));
      }
    }
    neo = new NeoLens(await (await fetch(NEO_HOME + "neo-final.json?v=2")).json());
    status.hidden = true;
    box.classList.add("ready");
  } catch (e) {
    status.textContent = "Couldn't load Neo. Check your connection and reload the page.";
    status.classList.add("bad");
    return;
  }

  // ---------- Helpers ----------
  const $ = sel => box.querySelector(sel);
  const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const show = c => c === " " ? "␣" : c === "\n" ? "↵" : esc(c);
  const label = c => c === " " ? "space" : c === "\n" ? "new line" : c;
  const clean = t => Array.from(t).filter(c => c in neo.stoi).join("").slice(-60);
  const withTemp = (p, temp) => {
    const w = p.map(x => Math.pow(x, 1 / temp));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map(x => x / s);
  };
  function pick(p) {
    let r = Math.random();
    for (let i = 0; i < p.length; i++) { r -= p[i]; if (r <= 0) return i; }
    return p.length - 1;
  }
  function write(start, n, temp) {
    let text = start, p = neo.read(start);
    for (let i = 0; i < n; i++) {
      const c = neo.chars[pick(withTemp(p, temp))];
      text += c; p = neo.next(text);
    }
    return text.slice(start.length);
  }

  // ---------- The sentence ----------
  const input = $("#jText");
  const STARTS = ["Once upon a time", "The king said", "The little bird", "There was a"];
  const chips = $("#jChips");
  STARTS.forEach(s => {
    const b = document.createElement("button");
    b.className = "chip"; b.type = "button"; b.textContent = s;
    b.onclick = () => { input.value = s; update(); };
    chips.appendChild(b);
  });

  let text = "", chances = null, layer = 3, temp = 0.8;

  // ---------- Step 1: tokens ----------
  function drawTokens() {
    const ids = Array.from(text).map(c => neo.stoi[c]);
    $("#jTokens").innerHTML = Array.from(text).map((c, i) =>
      `<span class="tok"><b>${show(c)}</b><small>${ids[i]}</small></span>`).join("");
    $("#jTokCount").textContent = `${text.length} tokens`;
  }

  // ---------- Step 2: attention ----------
  function drawAttention() {
    const a = neo.attn[layer], max = Math.max(...a);
    const chars = Array.from(text).slice(-a.length);
    $("#jAttn").innerHTML = chars.map((c, i) => {
      const w = a[i] / max, last = i === chars.length - 1;
      return `<span class="att${last ? " me" : ""}" style="--w:${w.toFixed(3)}" title="${Math.round(a[i] * 100)}%">${show(c)}</span>`;
    }).join("");
    box.querySelectorAll("[data-layer]").forEach(b => b.classList.toggle("on", Number(b.dataset.layer) === layer));
    const last = chars[chars.length - 1];
    $("#jAttnNote").innerHTML = `The last letter, <b>“${label(last)}”</b>, deciding which earlier letters matter. Darker = more attention.`;
  }

  // ---------- Step 3: next-letter guesses ----------
  function drawGuesses() {
    const p = withTemp(chances, temp);
    const top = p.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 5);
    $("#jBars").innerHTML = top.map(([v, i]) =>
      `<div class="bar"><span>${label(neo.chars[i])}</span><span class="track"><span class="fill" style="width:${(v * 100).toFixed(1)}%"></span></span><span class="pct">${Math.round(v * 100)}%</span></div>`).join("");
    $("#jTemp").textContent = temp.toFixed(1);
    $("#jTempWord").textContent = temp < 0.5 ? "safe, repeats itself" : temp > 1.2 ? "wild, makes mistakes" : "balanced";
  }

  function update() {
    text = clean(input.value) || "Once upon a time";
    chances = neo.read(text);
    box.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.textContent === text));
    drawTokens(); drawAttention(); drawGuesses();
    $("#jWritten").textContent = "";
  }

  input.addEventListener("input", update);
  box.querySelectorAll("[data-layer]").forEach(b => b.onclick = () => { layer = Number(b.dataset.layer); drawAttention(); });
  $("#jTempSlider").addEventListener("input", e => { temp = Number(e.target.value); drawGuesses(); });
  $("#jWrite").onclick = () => {
    $("#jWritten").innerHTML = `<span class="start">${esc(text)}</span>${esc(write(text, 120, temp))}`;
    chances = neo.read(text);
  };

  // ---------- Step 4: which answer is better? ----------
  function newPair() {
    const start = text;
    const a = write(start, 70, 0.5), b = write(start, 70, 1.6);
    const flip = Math.random() < 0.5;
    const pair = flip ? [[b, false], [a, true]] : [[a, true], [b, false]];
    $("#jPair").innerHTML = pair.map(([t, good], i) =>
      `<button class="answer" data-good="${good}"><span class="which">Answer ${"AB"[i]}</span>${esc(start)}<span class="new">${esc(t)}</span></button>`).join("");
    $("#jPrefNote").textContent = "";
    box.querySelectorAll(".answer").forEach(btn => btn.onclick = () => {
      box.querySelectorAll(".answer").forEach(x => x.classList.remove("picked"));
      btn.classList.add("picked");
      $("#jPrefNote").innerHTML = btn.dataset.good === "true"
        ? "Most people would pick this one too. A <b>reward model</b> learns from millions of picks like yours, then trains the LLM to write answers people prefer."
        : "Interesting pick! Most people would choose the other one. With millions of picks, a <b>reward model</b> learns what people usually prefer, then trains the LLM toward it.";
    });
  }
  $("#jNewPair").onclick = newPair;

  // ---------- Step 5: guess, or use a tool? ----------
  $("#jAsk").onclick = () => {
    const q = "37 x 24 = ";
    const guess = write(q, 6, 0.8).split("\n")[0];
    $("#jGuess").innerHTML = `<span class="start">${q}</span>${esc(guess)}`;
    $("#jTool").innerHTML = `<span class="call">calculator(37 * 24)</span> → <b>888</b>`;
    box.querySelector(".agent").classList.add("shown");
  };

  // ---------- Step through the five stages ----------
  const stages = Array.from(box.querySelectorAll(".stage"));
  const dots = Array.from(box.querySelectorAll(".jdot"));
  let at = 0;
  function go(i) {
    at = Math.max(0, Math.min(stages.length - 1, i));
    stages.forEach((s, k) => s.hidden = k !== at);
    dots.forEach((d, k) => { d.classList.toggle("on", k === at); d.setAttribute("aria-current", k === at ? "step" : "false"); });
    $("#jBack").disabled = at === 0;
    $("#jNext").textContent = at === stages.length - 1 ? "Start again" : "Next step →";
    if (at === 3 && !$("#jPair").children.length) newPair();
  }
  dots.forEach((d, k) => d.onclick = () => go(k));
  $("#jBack").onclick = () => go(at - 1);
  $("#jNext").onclick = () => go(at === stages.length - 1 ? 0 : at + 1);

  input.value = "Once upon a time";
  update();
  go(0);
})();
