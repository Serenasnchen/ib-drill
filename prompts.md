# IB Drill — Key Prompts

This file documents the key prompts used to build IB Drill, organized by phase. Saved as a reference for extending the project or adapting the workflow for other domains.

---

## 1. 题库生成 (Question Bank Generation)

### 基础生成模板
```
You are an IB interview coach. Generate 10 {category} interview questions for the {difficulty} level.

For each question, return a JSON object with the following fields:
- id: "{category_abbrev}_{number}" (e.g., acc_001)
- category: "{Category}"
- difficulty: "{Easy | Medium | Hard}"
- question: English question text
- answer_en: Detailed English answer (3–6 bullet points or paragraphs)
- answer_zh: Chinese translation of answer_en (natural, not literal)
- explanation_zh: Structured Chinese pedagogical note using these exact tags:
  【这题在考什么】...
  【正确回答逻辑】...
  【容易错在哪里】...

Return a valid JSON array. No markdown fences.
```

### 追加题目（保持 ID 连续）
```
Continue the {category} question bank. The last ID was {category_abbrev}_{n}.
Generate 5 more questions at {difficulty} level using the same JSON schema.
Start IDs from {category_abbrev}_{n+1}.
```

### 校对与优化答案
```
Review this IB interview answer for accuracy and completeness.
The question is: "{question}"
Current answer: "{answer_en}"

Fix any factual errors, improve clarity, and make sure the answer follows typical IB interview expectations.
Return the revised answer_en and a new answer_zh translation.
```

---

## 2. UI 优化 (UI Design & Iteration)

### 初始布局
```
Build a single-page flashcard web app for IB interview prep.
- One question card visible at a time
- "Reveal Answer" button that shows English answer, Chinese answer, and an expandable explanation
- Filter bar: category dropdown, difficulty dropdown, search input
- Header with progress indicator and star count
- Mobile-first, max-width 660px
- Color scheme: pink primary (#F03973), clean white cards, Inter font
No frameworks. Pure HTML/CSS/JS.
```

### 筛选 + 搜索功能
```
Add a filter system to the flashcard app:
- Category filter: All / Accounting / Valuation / M&A / LBO
- Difficulty filter: All / Easy / Medium / Hard
- Special filter: All / Starred / Review Later
- Full-text search that matches against question, answer_en, answer_zh, explanation_zh
- When filters change, re-render the question pool immediately
- Show "0 results" empty state if no matches
```

### 收藏 & 复习系统
```
Add a star/bookmark system:
- Star button on each question card (filled = starred, empty = not)
- "Review Later" button in the action bar
- Both lists persist via localStorage
- Header shows counts: ⭐ {n} and 📝 {n}
- Special filter dropdown can filter to starred or review-later questions only
```

### Shuffle vs Sequential 模式
```
Add two study modes:
- Shuffle: picks a random question from the current pool on each "Next"
- Sequential: goes through the pool in order, wrapping at the end
- Toggle buttons in the toolbar, active state clearly highlighted
- A mode pill in the header shows current mode (SHUFFLE / LINEAR)
- Switching modes resets position to the start of the pool
```

---

## 3. 欢迎页 (Welcome Screen)

### 欢迎页设计
```
Add a welcome/splash screen that shows before the main app:
- Centered layout, full viewport height
- Title: "IB Drill ✨"
- Tagline: "You will always be a free summer ✨"
- A single "Start" button
- On click: fade out the welcome screen, fade in the main app
- Transition: 480ms ease
- Keep the welcome screen's background consistent with the app's pink/white theme
```

### 文案迭代
```
Suggest 5 tagline options for an IB interview prep flashcard app.
Tone: slightly playful, self-aware about the grind, reassuring.
Audience: undergrad/MBA students recruiting for IB internships or FT roles.
Keep it under 10 words.
```

---

## 4. 迭代模板 (Reusable Iteration Templates)

### 新增功能
```
I have an IB flashcard app. Here is the current script.js: [paste]
Add the following feature: {feature description}
- Do not change any existing behavior
- Keep the same code style (vanilla JS, no frameworks)
- Minimize new global variables
Return only the modified script.js.
```

### Bug 修复
```
In my flashcard app, {describe bug}.
Here is the relevant code: [paste]
Fix the bug without changing any other behavior. Return the fixed code only.
```

### 题库扩展
```
I want to add more questions to the {category} section of my IB Drill app.
Current question IDs in this category go up to {last_id}.
Generate {n} new questions following the same JSON schema.
Focus on: {specific subtopics, e.g., "lease accounting, deferred taxes, revenue recognition edge cases"}
Difficulty: {Easy | Medium | Hard | mix}
```

### 样式调整
```
Adjust the styling of {component} in my flashcard app.
Current CSS for this component: [paste]
Change: {describe change, e.g., "make the answer cards slightly larger with more padding"}
Keep all other styles unchanged. Return only the modified CSS block.
```
