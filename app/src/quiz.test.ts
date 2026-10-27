import { describe, expect, it } from "vitest";
import { QUIZ_QUESTIONS, firstAttemptScore } from "./quiz";

/* Mirrors TraineeState["quiz"] — what recordQuiz accumulates per question. */
type QuizRecord = Record<string, { selected_option: string; is_correct: boolean; attempts: number }>;

describe("firstAttemptScore", () => {
  /* is_correct carries FIRST-attempt correctness (frozen by recordQuiz), so the
     score simply counts it. `attempts` is informational only. */

  it("correct-on-1st counts 1", () => {
    const quiz: QuizRecord = { "1": { selected_option: "B", is_correct: true, attempts: 1 } };
    expect(firstAttemptScore(quiz)).toBe(1);
  });

  it("a correct first attempt keeps its credit even if the trainee clicks again", () => {
    // Regression: re-clicking after the correct answer was revealed used to
    // inflate `attempts` and zero the credit, telling a 3/3 trainee "You got 0/3".
    const quiz: QuizRecord = { "1": { selected_option: "B", is_correct: true, attempts: 2 } };
    expect(firstAttemptScore(quiz)).toBe(1);
  });

  it("non-first-attempt correct answers count 0", () => {
    const quiz: QuizRecord = { "1": { selected_option: "B", is_correct: false, attempts: 2 } };
    expect(firstAttemptScore(quiz)).toBe(0);
  });

  it("mixed case scores correctly", () => {
    const quiz: QuizRecord = {
      "1": { selected_option: "B", is_correct: true, attempts: 1 }, // first try
      "2": { selected_option: "B", is_correct: false, attempts: 3 }, // got there after retries
      "3": { selected_option: "A", is_correct: false, attempts: 1 }, // still stuck
    };
    expect(firstAttemptScore(quiz)).toBe(1);
  });

  it("a full 3/3 pass scores 3 after any number of extra clicks", () => {
    const quiz: QuizRecord = {
      "1": { selected_option: "B", is_correct: true, attempts: 2 },
      "2": { selected_option: "B", is_correct: true, attempts: 1 },
      "3": { selected_option: "B", is_correct: true, attempts: 4 },
    };
    expect(firstAttemptScore(quiz)).toBe(3);
  });

  it("empty quiz scores 0", () => {
    expect(firstAttemptScore({})).toBe(0);
  });
});

describe("QUIZ_QUESTIONS", () => {
  it("has 3 questions with A/B/C options, correct answers and both feedbacks", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(3);
    expect(QUIZ_QUESTIONS.map((q) => q.correct)).toEqual(["B", "B", "B"]);
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options.map((o) => o.key)).toEqual(["A", "B", "C"]);
      expect(q.feedbackCorrect.length).toBeGreaterThan(0);
      expect(q.feedbackWrong.length).toBeGreaterThan(0);
    }
  });
});
