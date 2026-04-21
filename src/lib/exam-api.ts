export const API_BASE = "https://grammar.apiwala.bro.bd/api";

export type Question = {
  id: string;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  topic: string;
  difficulty: string;
};

export type AnswerInput = { question_id: string; selected_option: string };

export type ResultItem = {
  question_id: string;
  question: string;
  selected_option: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  options?: Record<string, string>;
};

export type SubmitResponse = {
  success: boolean;
  summary: { score: number; total: number; percentage: number };
  results: ResultItem[];
};

export const TOPICS: { value: string; label: string }[] = [
  { value: "all", label: "All Topics" },
  { value: "adjectives_and_adverbs", label: "Adjectives & Adverbs" },
  { value: "articles", label: "Articles" },
  { value: "comparatives_superlatives", label: "Comparatives & Superlatives" },
  { value: "conditionals", label: "Conditionals" },
  { value: "conjunctions", label: "Conjunctions" },
  { value: "determiners", label: "Determiners" },
  { value: "gerunds_and_infinitives", label: "Gerunds & Infinitives" },
  { value: "mixed_comprehensive", label: "Mixed Comprehensive" },
  { value: "modal_verbs", label: "Modal Verbs" },
  { value: "passive_voice", label: "Passive Voice" },
  { value: "phrasal_verbs", label: "Phrasal Verbs" },
  { value: "prepositions", label: "Prepositions" },
  { value: "pronouns", label: "Pronouns" },
  { value: "punctuation", label: "Punctuation" },
  { value: "question_formation", label: "Question Formation" },
  { value: "relative_clauses", label: "Relative Clauses" },
  { value: "reported_speech", label: "Reported Speech" },
  { value: "sentence_correction", label: "Sentence Correction" },
  { value: "subject_verb_agreement", label: "Subject–Verb Agreement" },
  { value: "tenses", label: "Tenses" },
];

export const DIFFICULTIES: { value: string; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export async function fetchQuestions(topic: string, difficulty: string): Promise<Question[]> {
  const params = new URLSearchParams();
  if (topic && topic !== "all") params.set("topic", topic);
  if (difficulty && difficulty !== "all") params.set("difficulty", difficulty);
  const qs = params.toString();
  const url = `${API_BASE}/questions${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.questions)) {
    throw new Error("Unexpected response from server");
  }
  return data.questions as Question[];
}

export async function submitAnswers(answers: AnswerInput[]): Promise<SubmitResponse> {
  const res = await fetch(`${API_BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`Failed to submit (${res.status})`);
  return (await res.json()) as SubmitResponse;
}

export function topicLabel(value: string): string {
  return TOPICS.find((t) => t.value === value)?.label ?? value;
}
export function difficultyLabel(value: string): string {
  return DIFFICULTIES.find((d) => d.value === value)?.label ?? value;
}
