// Persistent exam state via localStorage so accidental refreshes
// keep the user on the same stage (setup / countdown / exam / result).

import type { Question, SubmitResponse } from "./exam-api";

type ExamSetup = {
  topic: string;
  difficulty: string;
};

type Persisted = {
  setup: ExamSetup | null;
  questions: Question[] | null;
  answers: Record<string, string> | null;
  result: SubmitResponse | null;
  // Absolute epoch ms when the timer should reach 0
  deadline: number | null;
  // Index of the question the user was on
  currentIndex: number | null;
};

const KEY = "grammar-drill:state:v1";

const empty: Persisted = {
  setup: null,
  questions: null,
  answers: null,
  result: null,
  deadline: null,
  currentIndex: null,
};

function read(): Persisted {
  if (typeof window === "undefined") return { ...empty };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...empty, ...parsed };
  } catch {
    return { ...empty };
  }
}

function write(state: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy mode errors
  }
}

function patch(updates: Partial<Persisted>) {
  const next = { ...read(), ...updates };
  write(next);
}

export const examStore = {
  setSetup(setup: ExamSetup) {
    patch({ setup });
  },
  getSetup() {
    return read().setup;
  },
  setQuestions(qs: Question[]) {
    patch({ questions: qs });
  },
  getQuestions() {
    return read().questions;
  },
  setAnswers(a: Record<string, string>) {
    patch({ answers: a });
  },
  getAnswers() {
    return read().answers;
  },
  setResult(r: SubmitResponse) {
    patch({ result: r });
  },
  getResult() {
    return read().result;
  },
  setDeadline(ts: number | null) {
    patch({ deadline: ts });
  },
  getDeadline() {
    return read().deadline;
  },
  setCurrentIndex(i: number) {
    patch({ currentIndex: i });
  },
  getCurrentIndex() {
    return read().currentIndex;
  },
  // Clear only in-progress exam state (keep nothing)
  reset() {
    write({ ...empty });
  },
  // Clear in-progress fields but keep result + setup (used after submit)
  clearInProgress() {
    const cur = read();
    write({
      ...cur,
      questions: null,
      answers: null,
      deadline: null,
      currentIndex: null,
    });
  },
};
