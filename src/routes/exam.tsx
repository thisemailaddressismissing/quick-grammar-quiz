import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitAnswers, type Question } from "@/lib/exam-api";
import { examStore } from "@/lib/exam-store";

export const Route = createFileRoute("/exam")({
  head: () => ({
    meta: [
      { title: "Exam in progress — Grammar Drill" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamPage,
});

const TOTAL_TIME = 300; // 5 minutes
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function ExamPage() {
  const navigate = useNavigate();
  const [questions] = useState<Question[] | null>(() => examStore.getQuestions());
  const [index, setIndex] = useState(() => examStore.getCurrentIndex() ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => examStore.getAnswers() ?? {},
  );
  // Establish (or restore) an absolute deadline so refresh keeps real elapsed time.
  const [deadline] = useState<number>(() => {
    const existing = examStore.getDeadline();
    if (existing && existing > Date.now()) return existing;
    const fresh = Date.now() + TOTAL_TIME * 1000;
    examStore.setDeadline(fresh);
    return fresh;
  });
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showQuit, setShowQuit] = useState(false);

  // Refs to keep timer + submit logic stable across re-renders
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Persist answers + index whenever they change
  useEffect(() => {
    examStore.setAnswers(answers);
  }, [answers]);
  useEffect(() => {
    examStore.setCurrentIndex(index);
  }, [index]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    const payload = Object.entries(answersRef.current).map(([qid, opt]) => ({
      question_id: qid,
      selected_option: opt,
    }));
    try {
      const result = await submitAnswers(payload);
      examStore.setAnswers(answersRef.current);
      examStore.setResult(result);
      examStore.clearInProgress();
      navigate({ to: "/result" });
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    }
  }, [navigate]);

  // Single timer driven by the absolute deadline (refresh-safe)
  useEffect(() => {
    if (!questions || !questions.length) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        setTimeout(() => void handleSubmit(), 0);
      }
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [questions, deadline, handleSubmit]);

  // No questions in store (e.g., direct navigation) -> back home
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate({ to: "/" });
    }
  }, [questions, navigate]);

  if (!questions || questions.length === 0) return null;

  const current = questions[index];
  const selected = answers[current.id];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const lowTime = remaining < 30;

  function selectOption(opt: string) {
    setAnswers((a) => ({ ...a, [current.id]: opt }));
    if (!isLast) {
      window.setTimeout(() => {
        setIndex((i) => Math.min(i + 1, questions!.length - 1));
      }, 180);
    }
  }

  function goNext() {
    if (isLast) {
      void handleSubmit();
    } else {
      setIndex((i) => Math.min(i + 1, questions!.length - 1));
    }
  }

  function goPrev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function confirmQuit() {
    examStore.reset();
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* Sticky timer + progress */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={() => setShowQuit(true)}
            aria-label="Quit exam"
            className="flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M14 6l-8 8" />
            </svg>
            Quit
          </button>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Q {index + 1}
            <span className="text-muted-foreground/60"> / {questions.length}</span>
          </div>
          <div
            className={`font-display text-2xl font-bold tabular-nums transition-colors ${
              lowTime ? "text-destructive" : "text-foreground"
            }`}
            aria-live="polite"
          >
            {formatTime(remaining)}
          </div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <section className="mx-auto w-full max-w-md px-5 pb-32 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {current.topic.replace(/_/g, " ")} · {current.difficulty}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
          {current.question}
        </h2>

        <ul className="mt-6 space-y-2.5">
          {OPTION_KEYS.map((key) => {
            const text = current.options[key];
            if (!text) return null;
            const isSelected = selected === key;
            return (
              <li key={key}>
                <button
                  onClick={() => selectOption(key)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition active:scale-[0.99] ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-card-foreground hover:border-foreground/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? "bg-primary-foreground text-primary"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-base leading-snug">{text}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {submitError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}{" "}
            <button onClick={() => void handleSubmit()} className="ml-1 font-semibold underline">
              Retry
            </button>
          </div>
        )}
      </section>

      {/* Bottom action bar */}
      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-5 py-3">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="h-12 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex-1 text-center text-xs text-muted-foreground">
            {answeredCount} answered
          </div>
          {isLast ? (
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="h-12 flex-1 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-60"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={goNext}
              className="h-12 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Next
            </button>
          )}
        </div>
      </footer>

      {/* Quit confirmation */}
      {showQuit && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-bold text-foreground">Quit this exam?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your progress will be lost. The timer will reset.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowQuit(false)}
                className="h-11 flex-1 rounded-xl border border-border bg-background text-sm font-semibold text-foreground"
              >
                Keep going
              </button>
              <button
                onClick={confirmQuit}
                className="h-11 flex-1 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground"
              >
                Quit exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-accent"
            role="status"
            aria-label="Loading"
          />
          <div className="text-center">
            <p className="font-display text-xl font-semibold text-foreground">
              Getting your results…
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Grading your answers.</p>
          </div>
        </div>
      )}
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
