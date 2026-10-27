/* S4 diagnostic quiz — question text is verbatim from the spec (do not
   paraphrase). Score semantics: only FIRST-attempt correctness counts. */

export interface QuizQuestion {
  id: number; scenario: string; options: { key: "A" | "B" | "C"; text: string }[];
  correct: "A" | "B" | "C";
  feedbackCorrect: string; feedbackWrong: string;
}
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    scenario: "A teacher gives students a project topic, has them research it for 1 week individually, then present. Is this Sustained Inquiry?",
    options: [
      { key: "A", text: "Yes, because they did research" },
      { key: "B", text: "No, because there's no cycle of questioning, testing, and returning to inquiry" },
      { key: "C", text: "Yes, because it took a full week" },
    ],
    correct: "B",
    feedbackCorrect: "Correct — sustained inquiry requires a cycle: question → investigate → apply → new questions. A single research pass without returning to inquiry isn't sustained.",
    feedbackWrong: "Not quite — the key issue isn't how long they researched, but whether they returned to ask more questions after applying their findings. Try again.",
  },
  {
    id: 2,
    scenario: "Which of these is more likely to sustain inquiry over several weeks?",
    options: [
      { key: "A", text: "“What is the capital of France?”" },
      { key: "B", text: "“How might we redesign our canteen's queue system to reduce wait times?”" },
      { key: "C", text: "“What year was the printing press invented?”" },
    ],
    correct: "B",
    feedbackCorrect: "Correct — this is open-ended, tied to a real problem, and likely requires ongoing investigation, testing, and revision.",
    feedbackWrong: "Not quite — closed, fact-based questions are answered once and stop. Look for the open-ended question tied to a real problem.",
  },
  {
    id: 3,
    scenario: "A student's project stalls because they don't know what to research next. What's the best way to restart their inquiry?",
    options: [
      { key: "A", text: "Give them the answer directly" },
      { key: "B", text: "Have them test their current draft/prototype and see what questions arise from the results" },
      { key: "C", text: "Tell them to look it up on Google" },
    ],
    correct: "B",
    feedbackCorrect: "Correct — testing/critique is often what generates the next round of questions, restarting the inquiry cycle.",
    feedbackWrong: "Not quite — the restart comes from testing what they already have and letting the results pose new questions.",
  },
];

/* `is_correct` means "the FIRST attempt was correct" — recordQuiz freezes it on
   the first click and never flips it, so re-clicks and retries cannot change a
   score that was already earned. `attempts` is informational (the dashboard
   aggregates first attempts server-side the same way). */
export function firstAttemptScore(quiz: Record<string, { is_correct: boolean; attempts: number }>): number {
  return Object.entries(quiz).filter(([, q]) => q.is_correct).length;
}

/* End-of-quiz recap card copy (plan Task 9 Step 2 wording, verbatim). */
export const QUIZ_RECAP = {
  reinforcement:
    "Sustained inquiry is a cycle: questions drive investigation, findings get applied and tested, and testing raises new questions. If the cycle never restarts, it's research, not inquiry.",
};
