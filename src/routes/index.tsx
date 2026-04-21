import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DIFFICULTIES, TOPICS, fetchQuestions } from "@/lib/exam-api";
import { examStore } from "@/lib/exam-store";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user refreshed mid-exam or after submitting, send them back to where they were.
  useEffect(() => {
    const result = examStore.getResult();
    if (result) {
      navigate({ to: "/result" });
      return;
    }
    const qs = examStore.getQuestions();
    const deadline = examStore.getDeadline();
    if (qs && qs.length > 0 && deadline && deadline > Date.now()) {
      navigate({ to: "/exam" });
    }
  }, [navigate]);

  // When countdown active, decrement each second; on 0, navigate
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate({ to: "/exam" });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const questions = await fetchQuestions(topic, difficulty);
      if (!questions.length) {
        throw new Error("No questions returned for this selection.");
      }
      examStore.reset();
      examStore.setSetup({ topic, difficulty });
      examStore.setQuestions(questions.slice(0, 10));
      examStore.setCurrentIndex(0);
      examStore.setAnswers({});
      setLoading(false);
      setCountdown(3);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (countdown !== null) {
    return <CountdownView value={countdown} />;
  }

  return (
    <main className="min-h-[100dvh] bg-background px-5 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/70">
            Grammar Drill
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl">
            Sharpen your English in <span className="italic text-accent">5 minutes</span>.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            10 timed multiple-choice questions. Pick your topic, beat the clock, see results
            instantly.
          </p>
        </header>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Field label="Topic">
            <Select value={topic} onChange={setTopic} options={TOPICS} />
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} />
          </Field>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Loading questions…" : "Start Exam"}
          </button>

          <ul className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] text-muted-foreground">
            <li className="rounded-lg bg-secondary px-2 py-2">
              <div className="font-display text-lg text-foreground">10</div>
              questions
            </li>
            <li className="rounded-lg bg-secondary px-2 py-2">
              <div className="font-display text-lg text-foreground">5:00</div>
              minutes
            </li>
            <li className="rounded-lg bg-secondary px-2 py-2">
              <div className="font-display text-lg text-foreground">A–D</div>
              options
            </li>
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No login. No tracking. Just practice.
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
      </svg>
    </div>
  );
}

function CountdownView({ value }: { value: number }) {
  const display = value === 0 ? "Go!" : value;
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Get ready
      </p>
      <div
        key={value}
        className="mt-4 font-display text-[8rem] font-bold leading-none text-foreground animate-in zoom-in-50 duration-500"
      >
        {display}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Starting your 5-minute drill…</p>
    </main>
  );
}
