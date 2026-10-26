# Transformers & Large Language Models

How modern LLMs work, from the Transformer to reasoning models and agents.
Interactive notebook-style lessons, one question at a time.

**Live site:** https://gradlabs.in/learn/transformers/

An independent study companion, written in my own words. It follows the order of the Autumn 2026 lectures in Stanford's public
[CME295 syllabus](https://cme295.stanford.edu/syllabus/). Not affiliated with or endorsed by Stanford.

## How the site is built

Plain HTML, CSS and JavaScript, with no build step. The notebook look and the shared features come from
[study-notebook-design](https://github.com/mo-ri-ch/study-notebook-design), shared with my other courses.

```
index.html          home page and the path of lessons
lessons/            one page per lesson
assets/course.js    this course's lesson list (settings for the shared design)
```

To preview locally, run `python -m http.server` in this folder and open http://localhost:8000.
