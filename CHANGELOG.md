# Changelog

All notable changes to IB Drill are documented here.

---

## [v1.0.0] — 2025-Q1 · Initial Release

### Added
- **Question bank** — 32 questions across 4 categories (Accounting, Valuation, M&A, LBO)
- **Three difficulty levels** — Easy, Medium, Hard
- **Bilingual answers** — English answer + Chinese translation per question
- **Structured Chinese explanation** — each question includes 【这题在考什么】【正确回答逻辑】【容易错在哪里】annotations
- **Filter system** — filter by category, difficulty, and special lists (Starred / Review Later)
- **Full-text search** — searches across question text, both answers, and explanation
- **Shuffle mode** — random question selection from current filtered pool
- **Sequential mode** — linear progression through pool with wrap-around
- **Star / bookmark** — mark favorite questions, persisted via localStorage
- **Review Later** — flag questions for follow-up, persisted via localStorage
- **Progress bar** — shows position within current pool
- **Header stats** — live counts for total, starred, and review questions
- **Welcome screen** — animated splash with fade-in transition to main app
- **Expandable explanation** — collapsible accordion for Chinese pedagogical notes
- **Empty state** — friendly message when no questions match active filters
- **Mobile-first layout** — responsive, max-width 660px container

---

## [v1.1.0] — 2025-Q1

### Added
- **Expanded question bank** — 120 questions total (30 per category: Accounting, Valuation, M&A, LBO)
- New questions cover advanced topics: deferred taxes, NOL carryforwards, sale-leasebacks, NCI, convertible notes, foreign currency translation, working capital normalization (Accounting); unlevering/relevering beta, mid-year convention, NAV, sum-of-the-parts, negative FCF valuation (Valuation); tender offers, 338(h)(10) elections, spin-offs, reps & warranties, leveraged recaps, pooling of interests (M&A); cash sweep, PIK notes, rollover equity, maintenance vs. incurrence covenants, distressed LBO, GP-led continuation funds, secondary buyouts, take-privates, buy-and-build (LBO)

### Planned
- [ ] Keyboard navigation (arrow keys for next/prev, spacebar to reveal)
- [ ] Improve search ranking (exact match scored higher)

---

## [v2.0.0] — Future

- [ ] Progress tracking dashboard
- [ ] Spaced repetition (SM-2 algorithm)
- [ ] Timer / mock interview mode
- [ ] Export to PDF
- [ ] PWA support (offline use)
- [ ] Cloud sync for starred/review lists
