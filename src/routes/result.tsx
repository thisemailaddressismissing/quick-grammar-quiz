import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  difficultyLabel,
  fetchQuestions,
  topicLabel,
  type SubmitResponse,
} from "@/lib/exam-api";
import { examStore } from "@/lib/exam-store";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Your results — Grammar Drill" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const navigate = useNavigate();
  const [result] = useState<SubmitResponse | null>(() => examStore.getResult());
  const [setup] = useState(() => examStore.getSetup());
  const [questions] = useState(() => examStore.getQuestions());
  const [answers] = useState<Record<string, string>>(() => examStore.getAnswers() ?? {});
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    if (!result) navigate({ to: "/" });
  }, [result, navigate]);

  if (!result) return null;

  const { score, total, percentage } = result.summary;
  const totalQuestions = questions?.length ?? total;

  // Map question content from local store to enrich the result rendering
  const qById = new Map((questions ?? []).map((q) => [q.id, q]));

  async function tryAgain() {
    if (!setup) {
      navigate({ to: "/" });
      return;
    }
    setRetryError(null);
    setRetrying(true);
    try {
      const qs = await fetchQuestions(setup.topic, setup.difficulty);
      examStore.reset();
      examStore.setSetup(setup);
      examStore.setQuestions(qs.slice(0, 10));
      examStore.setCurrentIndex(0);
      examStore.setAnswers({});
      navigate({ to: "/exam" });
    } catch (e) {
      setRetrying(false);
      setRetryError(e instanceof Error ? e.message : "Failed to load. Try again.");
    }
  }

  const tone =
    percentage >= 80
      ? "text-success"
      : percentage >= 50
        ? "text-foreground"
        : "text-destructive";

  return (
    <main className="min-h-[100dvh] bg-background px-5 pb-28 pt-8">
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Exam complete
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Your results</h1>

        <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
              <div className="font-display text-5xl font-bold tabular-nums text-foreground">
                {score}
                <span className="text-2xl text-muted-foreground">/{totalQuestions}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Percentage
              </div>
              <div className={`font-display text-5xl font-bold tabular-nums ${tone}`}>
                {Math.round(percentage)}%
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          {setup && (
            <p className="mt-3 text-xs text-muted-foreground">
              {topicLabel(setup.topic)} · {difficultyLabel(setup.difficulty)}
            </p>
          )}
        </div>

        <h2 className="mt-8 font-display text-xl font-semibold text-foreground">
          Question review
        </h2>

        <ul className="mt-3 space-y-3">
          {result.results.map((r, i) => {
            const q = qById.get(r.question_id);
            const userAns = r.selected_option ?? answers[r.question_id] ?? null;
            const correct = r.is_correct;
            const opts = q?.options;
            return (
              <li
                key={r.question_id}
                className={`overflow-hidden rounded-2xl border bg-card ${
                  correct ? "border-success/40" : "border-destructive/40"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs">
                  <span className="font-semibold text-muted-foreground">Q{i + 1}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      correct
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {correct ? "Correct" : userAns ? "Incorrect" : "Skipped"}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {r.question}
                  </p>

                  <div className="space-y-1.5 text-sm">
                    {(() => {
                      // Prefer options from local store, fall back to those returned by API
                      const optionMap = (opts ?? r.options) as
                        | Record<string, string>
                        | undefined;
                      if (!optionMap) {
                        return (
                          <div className="text-xs text-muted-foreground">
                            Your answer: <strong>{userAns ?? "—"}</strong> · Correct:{" "}
                            <strong>{r.correct_answer}</strong>
                          </div>
                        );
                      }
                      return Object.entries(optionMap).map(([key, text]) => {
                        const isCorrect = key === r.correct_answer;
                        const isUser = key === userAns;
                        return (
                          <div
                            key={key}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                              isCorrect
                                ? "border-success/40 bg-success/10"
                                : isUser
                                  ? "border-destructive/40 bg-destructive/10"
                                  : "border-transparent bg-secondary/60"
                            }`}
                          >
                            <span className="mt-0.5 text-xs font-bold text-muted-foreground">
                              {key}
                            </span>
                            <span className="flex-1 text-foreground">{text}</span>
                            {isCorrect && (
                              <span className="text-xs font-semibold text-success">✓</span>
                            )}
                            {isUser && !isCorrect && (
                              <span className="text-xs font-semibold text-destructive">✕</span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                      <div className="uppercase tracking-wider text-muted-foreground">
                        Your answer
                      </div>
                      <div
                        className={`mt-0.5 font-semibold ${
                          userAns
                            ? correct
                              ? "text-success"
                              : "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {userAns ?? "Skipped"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                      <div className="uppercase tracking-wider text-muted-foreground">
                        Correct answer
                      </div>
                      <div className="mt-0.5 font-semibold text-success">
                        {r.correct_answer}
                      </div>
                    </div>
                  </div>

                  {r.explanation && (
                    <div className="rounded-lg bg-secondary/70 p-3 text-xs leading-relaxed text-foreground">
                      <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
                        Explanation
                      </div>
                      <p>{r.explanation}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {retryError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {retryError}
          </div>
        )}
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md gap-2 px-5 py-3">
          <button
            onClick={tryAgain}
            disabled={retrying}
            className="h-12 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {retrying ? "Loading…" : "Try Again"}
          </button>
          <button
            onClick={() => {
              examStore.reset();
              navigate({ to: "/" });
            }}
            className="h-12 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            New Exam
          </button>
        </div>
      </footer>
    </main>
  );
}
