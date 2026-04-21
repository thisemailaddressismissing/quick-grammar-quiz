// Lightweight in-memory store used to pass exam state between routes
// without backend persistence. Cleared on hard refresh.

import type { Question, SubmitResponse } from "./exam-api";

type ExamSetup = {
  topic: string;
  difficulty: string;
};

type Store = {
  setup: ExamSetup | null;
  questions: Question[] | null;
  answers: Record<string, string> | null; // question_id -> A/B/C/D
  result: SubmitResponse | null;
};

const store: Store = {
  setup: null,
  questions: null,
  answers: null,
  result: null,
};

export const examStore = {
  setSetup(setup: ExamSetup) {
    store.setup = setup;
  },
  getSetup() {
    return store.setup;
  },
  setQuestions(qs: Question[]) {
    store.questions = qs;
  },
  getQuestions() {
    return store.questions;
  },
  setAnswers(a: Record<string, string>) {
    store.answers = a;
  },
  getAnswers() {
    return store.answers;
  },
  setResult(r: SubmitResponse) {
    store.result = r;
  },
  getResult() {
    return store.result;
  },
  reset() {
    store.setup = null;
    store.questions = null;
    store.answers = null;
    store.result = null;
  },
};
