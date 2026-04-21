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
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refs to keep timer + submit logic stable across re-renders
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

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
      // Always include unanswered as empty? API expects selected_option string.
      // Send only answered; unanswered are treated as incorrect on the result screen.
      const result = await submitAnswers(payload);
      examStore.setAnswers(answersRef.current);
      examStore.setResult(result);
      navigate({ to: "/result" });
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    }
  }, [navigate]);

  // Single timer that survives re-renders
  useEffect(() => {
    if (!questions || !questions.length) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Defer submit to avoid setState-in-render
          setTimeout(() => {
            void handleSubmit();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [questions, handleSubmit]);

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
    // Auto-advance after a brief moment for tactile feel
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

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* Sticky timer + progress */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
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
              {submitting ? "Submitting…" : "Submit"}
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
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
