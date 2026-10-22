// course.js — everything that belongs to this course only.
// The shared look and features come from study-notebook-design (loaded after this file),
// which reads the settings below.

const COURSE_LESSONS = [
  { n: 1, step: "transformer", title: "The Transformer", file: "lesson1.html", ready: false,
    summary: "From words to numbers, from RNNs to attention, and the architecture behind every modern LLM.",
    leaves: "The original Transformer works. What did people change to make it faster and better?" },
  { n: 2, step: "tricks", title: "Transformer tricks", file: "lesson2.html", ready: false,
    summary: "Cheaper attention, better ways to mark position, and models like BERT built from one half of the Transformer.",
    leaves: "Scale these models up a lot. What makes something a large language model?" },
  { n: 3, step: "LLMs", title: "Large language models", file: "lesson3.html", ready: false,
    summary: "Mixture of experts, temperature and sampling, prompting, and getting models to show their steps.",
    leaves: "We know how an LLM writes. How does it learn to write in the first place?" },
  { n: 4, step: "training", title: "Training an LLM", file: "lesson4.html", ready: false,
    summary: "Pretraining, fitting big models on real hardware, and fine-tuning with tiny add-on matrices (LoRA).",
    leaves: "A trained model can write anything. How do we make it write what people actually want?" },
  { n: 5, step: "tuning", title: "Tuning to human preferences", file: "lesson5.html", ready: false,
    summary: "Reward models, RLHF and DPO: teaching a model which answers people prefer.",
    leaves: "The model is helpful now. Can it learn to think before it answers?" },
  { n: 6, step: "reasoning", title: "Reasoning models", file: "lesson6.html", ready: false,
    summary: "Training models to work through problems step by step, and spending more compute when it helps.",
    leaves: "It can think, but only with what it already knows. How can it look things up and take actions?" },
  { n: 7, step: "agents", title: "Agents", file: "lesson7.html", ready: false,
    summary: "Retrieval (RAG), calling tools, and models that plan, act and check their own work.",
    leaves: "Our model does all of this. How do we know if it's actually any good?" },
  { n: 8, step: "evaluation", title: "Evaluating LLMs", file: "lesson8.html", ready: false,
    summary: "Measuring quality, and using one model to judge another — with its biases.",
    leaves: "Where is all of this heading next?" },
  { n: 9, step: "what's next", title: "Current trends", file: "lesson9.html", ready: false,
    summary: "A recap of the whole course, and the newest ideas in the field.",
    leaves: null },
];

window.COURSE = {
  id: "tf-llms",                   // prefix for everything saved in this browser (progress, notes)
  pathLabel: "Understanding LLMs",
  lessons: COURSE_LESSONS,
  setup: [],
};
