import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { STAGES, type SceneId, type Stage, type StageDef } from "../../data/story-manifest";
import { isStageUnlocked } from "../../data/story";

/**
 * The four-stage inquiry rail that sits across the middle of the story screen.
 * The active stage is kept centred by scrolling the rail, so the arc reads as
 * travel: finished stages slide left, upcoming stages wait on the right.
 *
 * It is a <nav> of buttons rather than a tablist because Left/Right are global
 * previous/next-scene shortcuts; a roving-tabindex tablist would swallow them.
 */
export default function StoryTimeline({
  current,
  furthest,
  onSelect,
  onLockedSelect,
}: {
  current: Stage;
  furthest: SceneId;
  onSelect: (stage: StageDef) => void;
  onLockedSelect: (stage: StageDef) => void;
}) {
  const reduced = useReducedMotion();
  const rail = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLButtonElement | null>>({});

  // Keep the active stage at the centre of the rail. When the content fits,
  // scrollTo clamps to 0 and the rail simply sits centred.
  useEffect(() => {
    const container = rail.current;
    const node = nodes.current[current];
    if (!container || !node) return;
    const left = node.offsetLeft + node.offsetWidth / 2 - container.clientWidth / 2;
    // jsdom has no smooth-scroll implementation; fall back to the assignment
    // so the effect is also safe in tests and older browsers.
    try {
      container.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
    } catch {
      container.scrollLeft = left;
    }
  }, [current, reduced]);

  return (
    <nav aria-label="Inquiry stages" className="no-print">
      <div
        ref={rail}
        className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ol className="mx-auto flex min-w-full max-w-3xl items-start justify-between gap-2 px-2">
          {STAGES.map((stage, i) => {
            const unlocked = isStageUnlocked(stage, furthest);
            const isCurrent = stage.id === current;
            const done =
              stage.sceneIds.length > 0 && stage.sceneIds[stage.sceneIds.length - 1] < furthest;
            const nextStage = STAGES[i + 1];

            return (
              <li key={stage.id} className="relative flex flex-1 flex-col items-center">
                {/* connector to the next stage */}
                {nextStage && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-4 h-0.5 w-full bg-ink/10"
                  />
                )}

                <button
                  ref={(node) => {
                    nodes.current[stage.id] = node;
                  }}
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={!unlocked}
                  onClick={() => (unlocked ? onSelect(stage) : onLockedSelect(stage))}
                  className={`relative z-10 flex flex-col items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${
                    isCurrent ? "text-plum" : "text-ink-soft"
                  } ${unlocked ? "hover:bg-cream-deep/60" : "opacity-45"}`}
                >
                  <motion.span
                    aria-hidden="true"
                    animate={isCurrent && !reduced ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
                    className={`grid size-8 place-items-center rounded-full border-2 ${
                      isCurrent
                        ? "border-teal-deep bg-teal-deep text-white"
                        : done
                          ? "border-teal bg-teal/15 text-teal-deep"
                          : "border-ink/25 bg-cream text-ink-soft"
                    }`}
                  >
                    {done ? (
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                    ) : unlocked ? (
                      <span className="text-[11px] font-semibold">{i + 1}</span>
                    ) : (
                      <Lock size={13} aria-hidden="true" />
                    )}
                  </motion.span>

                  <span className="whitespace-nowrap font-display text-[11px] font-semibold leading-tight sm:text-xs">
                    {stage.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
