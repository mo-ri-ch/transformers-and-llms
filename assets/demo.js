// demo.js — "Watch a tiny Transformer write" on the home page.
// It uses Neo, the small Transformer students build in "Build a Tiny LLM"
// (4 layers, 4 attention heads, reads letter by letter, trained on Grimm's Fairy Tales).
// While it writes, the letters it pays attention to glow, and bars show its top guesses.

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
  const box = document.getElementById("neoDemo");
  if (!box) return;
  const status = box.querySelector("[data-status]");

  // ---------- Load the model ----------
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
    status.textContent = "It didn't wake up. Check your connection and reload.";
    return;
  }

  // ---------- Helpers ----------
  const page = document.getElementById("page"), guess = document.getElementById("guess"), go = document.getElementById("go");
  const esc = c => c === "<" ? "&lt;" : c === "&" ? "&amp;" : c;
  const label = c => c === " " ? "space" : c === "\n" ? "↵" : c;
  const TEMP = 0.6, LENGTH = 160, SPEED = 70;
  const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function pick(p) {
    const w = p.map(x => Math.pow(x, 1 / TEMP)), s = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * s;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return w.length - 1;
  }

  let text = "", chances = null, timer = null, start = "Once upon a time";

  // The page: every letter, glowing by how much the newest letter attends to it (last layer)
  function drawPage() {
    const a = neo.attn ? neo.attn[neo.attn.length - 1] : [];
    const max = Math.max(...a, 1e-9), from = text.length - a.length;
    page.innerHTML = Array.from(text).map((c, i) => {
      const j = i - from, w = j >= 0 ? a[j] / max : 0;
      return i === text.length - 1 ? `<span class="me">${esc(c)}</span>` : w > 0.08 ? `<span style="--w:${w.toFixed(2)}">${esc(c)}</span>` : esc(c);
    }).join("");
    page.scrollTop = page.scrollHeight;
  }
  function drawGuess() {
    const top = chances.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 3);
    guess.innerHTML = top.map(([v, i]) =>
      `<div class="gbar"><span>${label(neo.chars[i])}</span><span class="track"><span class="fill" style="width:${(v * 100).toFixed(0)}%"></span></span><span class="pct">${Math.round(v * 100)}%</span></div>`).join("");
  }
  function begin(s) {
    stop();
    start = s; text = s; chances = neo.read(s);
    drawPage(); drawGuess();
    box.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.textContent === s));
  }
  function stop() { clearTimeout(timer); timer = null; go.textContent = "▶ Watch it write"; }
  function tick() {
    text += neo.chars[pick(chances)];
    chances = neo.next(text);
    drawPage(); drawGuess();
    if (text.length - start.length >= LENGTH) { stop(); go.textContent = "↺ Write again"; return; }
    timer = setTimeout(tick, quick ? 0 : SPEED);
  }

  ["Once upon a time", "The king said", "The little bird"].forEach(s => {
    const b = document.createElement("button");
    b.className = "chip"; b.type = "button"; b.textContent = s;
    b.onclick = () => begin(s);
    document.getElementById("starts").appendChild(b);
  });
  go.onclick = () => {
    if (timer) { stop(); return; }
    if (text.length - start.length >= LENGTH) begin(start);
    go.textContent = "⏸ Pause";
    tick();
  };
  begin(start);
})();
