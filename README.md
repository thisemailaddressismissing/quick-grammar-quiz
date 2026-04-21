# English MCQ Exam Practice

A fast, mobile-first English grammar practice app. Pick a topic and difficulty, take a 5‑minute timed exam of 10 multiple‑choice questions, and get instant results with explanations.

> Powered by the public grammar API at `https://grammar.apiwala.bro.bd/api` — currently **3,650+ questions** across **20 topics**, with more added regularly.

Crafted by [iamrakib.dev](https://iamrakib.dev).

---

## ✨ Features

- 🎯 **Topic + difficulty filters** — pick a specific area (tenses, prepositions, conditionals…) or go with "All Topics" / "All Levels".
- ⏱ **5‑minute timer** — counts down from `05:00`, turns red under 30 seconds, and auto‑submits at zero.
- 🧠 **One question at a time** — large tap targets, A/B/C/D options, auto‑advance on selection.
- 🔁 **Refresh‑safe** — questions, answers, current index, and the absolute deadline are persisted to `localStorage`, so a stray refresh never loses progress or breaks the timer.
- 🚪 **Quit exam** — confirmation modal lets users abandon a session and return home cleanly.
- 📊 **Instant results** — score, percentage, per‑question correct/incorrect view with explanations.
- 📱 **Mobile‑first** — clean "ink‑on‑cream" design, distraction‑free, no reloads between screens.
- ⚡ **Lightweight** — `fetch` only, `useState` + `useEffect`, no Redux, no heavy state libs.

## 🧭 User flow

```
Home  →  pick topic + difficulty  →  3‑second countdown  →  Exam (timed)
                                                              │
                                          auto‑submit at 0  ◀─┤
                                                              │
                                                   Result  ◀──┘
                                                   │
                                                   ├─ Try Again (same filters)
                                                   └─ New Exam  (back home)
```

## 🛠 Tech stack

- **React 19** (functional components, hooks only)
- **TanStack Start** + **TanStack Router** (file‑based routing, SSR‑ready)
- **Vite 7** as the build tool
- **Tailwind CSS v4** with semantic design tokens in `src/styles.css`
- **shadcn/ui** primitives
- **TypeScript** (strict)

## 📡 API

Base URL: `https://grammar.apiwala.bro.bd/api`

### `GET /questions`
Query params:
- `topic` — one of: `adjectives_and_adverbs`, `articles`, `comparatives_superlatives`, `conditionals`, `conjunctions`, `determiners`, `gerunds_and_infinitives`, `mixed_comprehensive`, `modal_verbs`, `passive_voice`, `phrasal_verbs`, `prepositions`, `pronouns`, `punctuation`, `question_formation`, `relative_clauses`, `reported_speech`, `sentence_correction`, `subject_verb_agreement`, `tenses` (or omit for all)
- `difficulty` — `easy` | `medium` | `hard` (or omit for all)

### `POST /submit`
```json
{
  "answers": [
    { "question_id": "…", "selected_option": "A" }
  ]
}
```

## 📂 Project structure

```
src/
├── routes/
│   ├── __root.tsx        # Root layout
│   ├── index.tsx         # Home: filters + 3s countdown
│   ├── exam.tsx          # Timed exam screen
│   └── result.tsx        # Score + per‑question review
├── lib/
│   ├── exam-api.ts       # fetch wrappers + types + topic/difficulty constants
│   └── exam-store.ts     # localStorage‑backed session store
├── components/ui/        # shadcn/ui primitives
└── styles.css            # Tailwind v4 + design tokens
```

## 🚀 Getting started

```bash
# install
bun install      # or: npm install

# dev server
bun run dev      # http://localhost:5173

# production build
bun run build
bun run preview
```

## 🧱 Design notes

- **No backend persistence** — every session lives in the browser only.
- **No auth** — open the app and start practicing.
- **Timer correctness across refreshes** — we store an absolute `deadline` (epoch ms) instead of a remaining‑seconds counter, so reloading the page doesn't add or lose time.
- **Submission UX** — full‑screen "Getting your results…" spinner instead of a button‑level loader.

## 📜 License

MIT — do whatever you want, attribution appreciated.

## 🙌 Credits

Built with care by **[iamrakib.dev](https://iamrakib.dev)**. Questions API maintained by the same.
