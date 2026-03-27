# IB Drill

A focused, AI-native study tool for Investment Banking technical interview prep.

**Live Demo:** [https://your-deployment-url.vercel.app](https://your-deployment-url.vercel.app)

---

## Overview

IB Drill is a single-page web app built to help candidates prepare for IB technical interviews. It combines a structured 120-question bilingual question bank with an integrated AI assistant (Ask AI, powered by Gemini) and a per-question notes system — all in a clean, distraction-free interface.

The core learning loop: read the question, think through the answer, reveal the standard response, ask the AI to go deeper, and take notes. No account required, no setup.

---

## Key Features

**Question Bank**
- 120 technical interview questions across 4 categories: Accounting, Valuation, M&A, LBO
- 3 difficulty levels: Easy, Medium, Hard
- Each question includes a full English answer, Chinese translation, and a structured Chinese explanation covering what's being tested, the correct answer logic, and common mistakes

**Study Modes**
- Shuffle mode and Sequential mode
- Filter by category, difficulty, starred, or review-flagged questions
- Full-text search across questions and answers

**Progress Tracking**
- Star questions to bookmark
- Flag questions for later review
- Both lists persist across sessions via localStorage

**Ask AI**
- Inline AI assistant powered by Google Gemini (gemini-2.5-flash)
- Always available — ask before or after revealing the answer
- Context-aware: if the answer has been revealed, the AI incorporates it into the response
- Quick-tap suggestion chips per category
- Responses delivered with a typewriter animation

**My Notes**
- Per-question freeform text notes
- Saved automatically to localStorage as you type
- Persists across sessions; shows an indicator when a note exists for the current question

---

## AI-Native Positioning

IB Drill is designed around AI as a first-class feature, not an add-on. The Ask AI panel sits directly in the study flow — between the question and the answer — so learners can interrogate concepts, challenge assumptions, and go beyond the static answer at any point.

The backend prompt is tuned to respond like an experienced IB analyst talking to a junior: direct, structured, no filler. A `cleanText()` post-processing step strips markdown symbols before returning the response, so output reads as natural prose.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JavaScript (no framework) |
| AI Backend | Vercel Serverless Function (Node.js) |
| AI Model | Google Gemini 2.5 Flash via REST API |
| Storage | Browser localStorage (no database) |
| Hosting | Vercel |

---

## Project Structure

```
IBDrill/
├── index.html              # Single-page app
├── style.css               # All styles
├── script.js               # All frontend logic
├── questions.json          # Combined question bank (120 questions)
├── questions_accounting.json
├── questions_valuation.json
├── questions_ma.json
├── questions_lbo.json
├── api/
│   └── ask.js              # Vercel serverless function — Gemini API proxy
├── vercel.json             # Vercel function config
├── _gen.py / _gen2.py      # Question generation scripts (offline use)
└── prompts.md              # Prompts used in building this project
```

---

## Deployment

The app is hosted on **Vercel**. Static files are served from the project root; the `/api/ask` endpoint runs as a serverless Node.js function that proxies requests to the Gemini API, keeping the API key off the client.

**Environment variable required in Vercel project settings:**

```
GEMINI_API_KEY=your_google_ai_studio_api_key
```

Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

To deploy your own instance:
1. Fork this repo
2. Import into Vercel
3. Add `GEMINI_API_KEY` under **Settings → Environment Variables**
4. Deploy — no build step needed

---

## Future Improvements

- Multi-turn conversation memory in Ask AI
- Spaced repetition scheduling based on self-rated confidence
- Progress dashboard (questions attempted, weak areas by category)
- Export notes as Markdown or PDF
- Mobile-optimized layout
