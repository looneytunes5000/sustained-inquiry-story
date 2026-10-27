import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import SectionShell from "../components/SectionShell";
import { QUIZ_QUESTIONS, QUIZ_RECAP, firstAttemptScore, type QuizQuestion } from "../quiz";
import { useSession } from "../session";

type OptionKey = QuizQuestion["correct"];

const ease = { duration: 0.25, ease: "easeOut" as const };

/** S4 — self-check quiz: one question at a time, instant feedback, recap at the end. */
export default function Quiz() {
  const { quiz, recordQuiz, markCompleted } = useSession();
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [dimmed, setDimmed] = useState<Record<number, OptionKey[]>>({});
  const [solved, setSolved] = useState<Set<number>>(new Set());

  const finished = idx >= QUIZ_QUESTIONS.length;
  const score = firstAttemptScore(quiz);
  const q = finished ? null : QUIZ_QUESTIONS[idx];

  // Every pick — right or wrong — is recorded so attempts accumulate.
  const handleSelect = (question: QuizQuestion, key: OptionKey) => {
    const isCorrect = key === question.correct;
    recordQuiz(question.id, key, isCorrect);
    setSelected(key);
    if (isCorrect) setSolved((s) => new Set(s).add(question.id));
    else setDimmed((d) => ({ ...d, [question.id]: [...(d[question.id] ?? []), key] }));
  };

  const next = () => {
    setSelected(null);
    setIdx((i) => i + 1);
  };

  return (
    <SectionShell id={4} canContinue={finished} onContinue={() => markCompleted(4)}>
      {!finished && (
        <p className="mb-6 rounded-xl bg-cream-deep/70 px-4 py-3 text-sm text-ink-soft">
          A quick self-check, not a test — each answer comes with instant feedback so you can see
          how your thinking lines up with sustained inquiry.
        </p>
      )}

      {q && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-soft">
              Question {idx + 1} of {QUIZ_QUESTIONS.length}
            </p>
            <div className="flex gap-1.5" aria-hidden={true}>
              {QUIZ_QUESTIONS.map((qq, i) => (
                <span
                  key={qq.id}
                  className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                    solved.has(qq.id) ? "bg-moss" : i === idx ? "bg-plum" : "bg-ink/15"
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ease}
            className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-3 sm:gap-5">
              <span
                aria-hidden={true}
                className="-mt-2 select-none font-display text-6xl leading-none text-plum sm:text-7xl"
              >
                “
              </span>
              <h2 className="pt-2 font-display text-xl leading-snug text-ink sm:text-2xl">
                {q.scenario}
              </h2>
            </div>

            <div role="radiogroup" aria-label={`Answers for question ${q.id}`} className="mt-6 grid gap-3">
              {q.options.map((o) => (
                <OptionButton
                  key={o.key}
                  optionKey={o.key}
                  text={o.text}
                  question={q}
                  selected={selected}
                  isDimmed={(dimmed[q.id] ?? []).includes(o.key)}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {selected !== null && selected === q.correct && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ease}
                role="status"
                className="mt-4 rounded-xl border-2 border-moss/40 bg-moss/10 p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-moss" aria-hidden={true} />
                  <p className="text-[15px] leading-relaxed text-ink">{q.feedbackCorrect}</p>
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-moss-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-deep"
                >
                  Next question <ArrowRight size={16} aria-hidden={true} />
                </button>
              </motion.div>
            )}

            {selected !== null && selected !== q.correct && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={ease}
                role="status"
                className="mt-4 rounded-xl border-2 border-orange/40 bg-blush/60 p-5"
              >
                <div className="flex items-start gap-3">
                  <RotateCcw size={20} className="mt-0.5 shrink-0 text-orange" aria-hidden={true} />
                  <p className="text-[15px] leading-relaxed text-ink">{q.feedbackWrong}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-plum px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon"
                >
                  <RotateCcw size={16} aria-hidden={true} /> Try again
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}

      {finished && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ease}
          aria-label="Quiz recap"
          className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden={true}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-moss text-white"
            >
              <CheckCircle2 size={26} />
            </span>
            <h2 className="font-display text-2xl leading-snug text-plum sm:text-3xl">
              You got {score}/3 — here's a quick recap of the key idea
            </h2>
          </div>
          <div className="mt-5 rounded-xl border-l-4 border-teal bg-teal/5 px-5 py-4">
            <p className="text-[16px] leading-relaxed text-ink">{QUIZ_RECAP.reinforcement}</p>
          </div>
        </motion.section>
      )}
    </SectionShell>
  );
}

/** Big radio-style option: A/B/C key circle (plum border, teal fill when selected). */
function OptionButton({
  optionKey,
  text,
  question,
  selected,
  isDimmed,
  onSelect,
}: {
  optionKey: OptionKey;
  text: string;
  question: QuizQuestion;
  selected: OptionKey | null;
  isDimmed: boolean;
  onSelect: (question: QuizQuestion, key: OptionKey) => void;
}) {
  const isSelected = selected === optionKey;
  // Once a correct answer is revealed the question is done; wrong picks dim and
  // lock themselves while the remaining options stay re-enabled for a retry.
  const locked = selected !== null && selected === question.correct;

  let look = "border-ink/15 bg-white hover:border-teal/70 hover:shadow-sm";
  if (isDimmed) look = "border-ink/10 bg-cream-deep/70 opacity-45";
  else if (isSelected && locked) look = "border-moss bg-moss/10";
  else if (locked) look = "border-ink/10 bg-white opacity-60";
  else if (isSelected) look = "border-orange/60 bg-blush/50 opacity-70";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={isDimmed || locked}
      onClick={() => onSelect(question, optionKey)}
      className={`flex w-full items-start gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 disabled:cursor-not-allowed ${look}`}
    >
      <span
        aria-hidden={true}
        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-semibold transition-colors ${
          isSelected && !isDimmed ? "border-teal-deep bg-teal-deep text-white" : "border-plum text-plum"
        }`}
      >
        {optionKey}
      </span>
      <span className="pt-2 text-[15px] leading-relaxed text-ink">{text}</span>
    </button>
  );
}
