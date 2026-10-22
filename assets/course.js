// course.js — everything that belongs to this course only.
// The shared look and features come from study-notebook-design (loaded after this file),
// which reads the settings below.

const COURSE_LESSONS = [
  // Follows the order of the Autumn 2026 lectures (lessons 1–4: videos out; 5–9: coming during the quarter).
  { n: 1, label: "1a", step: "words → numbers", title: "From words to numbers", file: "lesson1a.html", ready: true,
    summary: "Tokens, embeddings, a tiny neural network, word2vec, and RNNs: how text becomes numbers a model can use.",
    leaves: "RNNs forget what they read long ago. How can a model look straight back at any earlier word?" },
  { n: 2, label: "1b", step: "attention", title: "Attention and the Transformer", file: "lesson1b.html", ready: false,
    summary: "Attention, query–key–value, and the Transformer, built up step by step and run end to end.",
    leaves: "The Transformer works. What turns it into a large language model?" },
  { n: 3, label: "2", step: "LLMs", title: "Large language models", file: "lesson2.html", ready: false,
    summary: "Model families, mixture of experts, cheaper attention (MQA, GQA), RoPE, and how temperature and sampling pick each word.",
    leaves: "We know what an LLM is. How does it learn everything it knows?" },
  { n: 4, label: "3", step: "training", title: "Training an LLM", file: "lesson3.html", ready: false,
    summary: "Pretraining, fine-tuning, LoRA, preference tuning, reasoning, and teaching small models from big ones (distillation).",
    leaves: "Much of this training uses rewards instead of right answers. How does a model learn from a reward?" },
  { n: 5, label: "4", step: "rewards", title: "Reinforcement learning", file: "lesson4.html", ready: false,
    summary: "Rewards and policy gradients, then RLHF with PPO, reasoning with GRPO, and on-policy distillation.",
    leaves: "Training is done. How do we run these huge models fast enough to use?" },
  { n: 6, label: "5", step: "systems", title: "LLM systems", file: "lesson5.html", ready: false,
    summary: "Training across many GPUs, KV caching, speculative decoding, Flash Attention and hardware trade-offs.",
    leaves: "The model is fast. How can it use tools and get real work done?" },
  { n: 7, label: "6", step: "agents", title: "AI agents", file: "lesson6.html", ready: false,
    summary: "Tool calling, MCP, memory and retrieval, keeping context small, and coding agents.",
    leaves: "Agents can do a lot. How do we know if they're actually any good?" },
  { n: 8, label: "7", step: "evaluation", title: "Evaluating LLMs", file: "lesson7.html", ready: false,
    summary: "Models judging models, their biases, testing agents, and what benchmarks really measure.",
    leaves: "Every model so far writes one token at a time. Is there another way?" },
  { n: 9, label: "8", step: "diffusion", title: "Diffusion LLMs", file: "lesson8.html", ready: false,
    summary: "Writing the whole answer at once and refining it, like image models do: masked and discrete diffusion.",
    leaves: "Where is all of this heading next?" },
  { n: 10, label: "9", step: "what's next", title: "Trending topics", file: "lesson9.html", ready: false,
    summary: "A recap of the whole course, models that see and hear, and closing thoughts.",
    leaves: null },
];

window.COURSE = {
  id: "tf-llms",                   // prefix for everything saved in this browser (progress, notes)
  pathLabel: "Understanding LLMs",
  lessons: COURSE_LESSONS,
  setup: [],
};
