# IB Drill ✨

A lightweight, bilingual flashcard tool for IB (Investment Banking) technical interview prep. Built to help candidates efficiently practice the most commonly tested concepts across Accounting, Valuation, M&A, and LBO.

> "You will always be a free summer ✨"

---

## Demo

🔗 [Live Demo](#) ← *coming soon*

---

## Core Features

- **Four topic categories** — Accounting, Valuation, M&A, LBO
- **Three difficulty tiers** — Easy, Medium, Hard
- **Shuffle & Sequential modes** — random practice or structured review
- **Bilingual answers** — English answer + Chinese translation, side by side
- **Structured Chinese explanation** — each question annotated with:
  - 📋 这题在考什么 (what concept is tested)
  - 📝 正确回答逻辑 (how to structure your answer)
  - ⚠️ 容易错在哪里 (common mistakes to avoid)
- **Full-text search** — searches across questions, answers, and explanations
- **Star & Review Later** — bookmark favorites and flag items for follow-up
- **Persistent state** — starred and review lists saved to localStorage

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | Vanilla HTML + CSS (no framework) |
| Logic | Vanilla JavaScript |
| Data | JSON (one combined + four category files) |
| Storage | localStorage (no backend) |
| Fonts | Inter (Google Fonts) |

Zero dependencies. Opens directly in any browser.

---

## AI-Driven Workflow

This project was built end-to-end with AI assistance:

1. **Question generation** — prompts to GPT/Claude to produce structured Q&A pairs with bilingual answers and pedagogical `explanation_zh` annotations
2. **UI design** — iterative prompting to generate card layout, filter toolbar, answer reveal animation, and welcome screen
3. **Data pipeline** — Python scripts (`_gen.py`, `_gen2.py`) to batch-generate and format JSON question files from raw interview guides
4. **Iteration** — all feature additions (star system, review mode, search, sequential mode) driven by conversational prompts

See [`prompts.md`](./prompts.md) for key prompts used throughout the project.

---

## Project Structure

```
IBDrill/
├── index.html              # Single-page app
├── style.css               # All styles
├── script.js               # App logic
├── questions.json          # Combined question bank (32 questions)
├── questions_accounting.json
├── questions_valuation.json
├── questions_ma.json
├── questions_lbo.json
├── _gen.py / _gen2.py      # Question generation scripts
└── prompts.md              # Prompts used in this project
```

---

## Future Improvements

- [ ] Expand question bank (target: 100+ questions per category)
- [ ] Progress tracking dashboard (completion %, weak areas)
- [ ] Spaced repetition algorithm (SM-2)
- [ ] Timer mode for mock interview practice
- [ ] Export starred questions to PDF
- [ ] Mobile app wrapper (PWA or React Native)
- [ ] User accounts + cloud sync
- [ ] Community-contributed questions
