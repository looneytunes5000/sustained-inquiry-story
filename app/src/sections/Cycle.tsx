import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointerClick, Sparkles } from "lucide-react";
import SectionShell from "../components/SectionShell";
import CycleDiagram from "./CycleDiagram";
import {
  CYCLE_EXAMPLES,
  CYCLE_NODES,
  DISCIPLINES,
  disciplineFromSubject,
  type CycleNodeId,
  type Discipline,
} from "../content";
import { useSession } from "../session";

/**
 * S2 — the inquiry cycle (design showpiece). Clicking a node marks it visited,
 * opens the detail panel (definition + discipline examples), and the Continue
 * gate unlocks once all five stages have been explored.
 */
export default function Cycle() {
  const { markCompleted, user } = useSession();
  const [visited, setVisited] = useState<Set<CycleNodeId>>(() => new Set());
  const [active, setActive] = useState<CycleNodeId | null>(null);
  // The landing form promises subject area tailors the examples — honour it by
  // opening on the trainee's own discipline (manual override stays available).
  const suggested = disciplineFromSubject(user?.subject_area);
  const [discipline, setDiscipline] = useState<Discipline>(suggested ?? "engineering");
  useEffect(() => {
    if (suggested) setDiscipline(suggested);
  }, [suggested]);

  const select = (id: CycleNodeId) => {
    setActive(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const allVisited = visited.size === CYCLE_NODES.length;
  const node =
    active === null ? null : (CYCLE_NODES.find((n) => n.id === active) ?? null);

  return (
    <SectionShell
      id={2}
      canContinue={allVisited}
      continueLabel={
        allVisited ? "Continue" : `Visit all 5 nodes (${visited.size}/5)`
      }
      onContinue={() => markCompleted(2)}
    >
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
        Select each stage of the inquiry cycle to see what it means — and what
        it looks like in your discipline.
      </p>

      {/* Diagram and detail panel sit side-by-side only at xl+; below that the
          panel drops under the diagram at full width so it never gets squeezed
          into a thin column. The 420px diagram cap leaves the panel ~360px+ of
          readable editorial width at xl. */}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,420px)_minmax(340px,1fr)]">
        <CycleDiagram visited={visited} active={active} onSelect={select} />

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {node ? (
              <motion.section
                key={node.id}
                role="region"
                aria-label={node.title}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
                    Stage {node.n} of 5
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-semibold text-plum sm:text-3xl">
                    {node.title}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-ink">
                    {node.definition}
                  </p>

                  <div
                    role="tablist"
                    aria-label="Discipline examples"
                    className="mt-6 flex flex-wrap gap-2"
                  >
                    {DISCIPLINES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        role="tab"
                        aria-selected={discipline === d.id}
                        onClick={() => setDiscipline(d.id)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          discipline === d.id
                            ? "bg-plum text-white"
                            : "bg-cream-deep text-ink-soft hover:bg-ink/10"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {suggested && discipline === suggested && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-soft">
                      <Sparkles size={13} className="text-teal-deep" aria-hidden={true} />
                      Preselected from your subject area
                      {user?.subject_area ? ` (${user.subject_area})` : ""} — switch any time.
                    </p>
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={discipline}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="mt-4 border-l-[3px] border-orange bg-cream px-4 py-3 text-[15px] leading-relaxed text-ink"
                    >
                      {CYCLE_EXAMPLES[node.id][discipline]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.section>
            ) : (
              <motion.div
                key="invite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-teal/30 bg-white/60 px-8 py-14 text-center"
              >
                <MousePointerClick
                  size={30}
                  className="text-teal"
                  aria-hidden={true}
                />
                <p className="text-sm font-medium text-ink-soft">
                  Select a stage on the cycle to explore it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionShell>
  );
}
