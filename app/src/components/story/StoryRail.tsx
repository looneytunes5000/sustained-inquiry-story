import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pin } from "lucide-react";
import { PRIORITY_QUESTION_IDS, type SceneId } from "../../data/story-manifest";
import { cardsAtScene, type WallCard } from "../../data/story";

/* Only statuses that carry meaning get a stamp. */
const STATUS_CLASS: Record<string, string> = {
  reframed: "bg-teal/15 text-teal-deep",
  prioritised: "bg-moss/20 text-moss-deep",
  answered: "bg-moss/20 text-moss-deep",
  discarded: "bg-ink/8 text-ink-soft line-through",
  open: "bg-plum/10 text-plum",
};
const UNSTAMPED = new Set(["raised", "parked"]);

/**
 * The wall: one column beside the video, built to fit the screen rather than
 * scroll, because the growth of the list IS the point — a scrollbar hides it.
 *
 * Two tiers:
 *   - the three the team chose, pinned as a block from the moment they are
 *     chosen (scene 4), fixed order, held even after they are answered;
 *   - everything else, as compact rows that accumulate down the column.
 *
 * The three get full note cards; the rest are short rows whose second line is
 * only the outcome (when settled) so fourteen questions still fit at the end.
 */
export default function StoryRail({ scene }: { scene: SceneId }) {
  const cards = cardsAtScene(scene);
  const reduced = useReducedMotion();

  // Only pin once the team has actually chosen. Q3 exists from scene 2 as a
  // plain question, so its presence is not the trigger; Q6 is born at the
  // scene where the three are picked, so its arrival is.
  const chosen = cards.some((c) => c.id === PRIORITY_QUESTION_IDS[0]);
  const pinned = chosen
    ? PRIORITY_QUESTION_IDS.map((id) => cards.find((c) => c.id === id)).filter(
        (c): c is WallCard => Boolean(c),
      )
    : [];
  const pinnedIds = new Set(pinned.map((p) => p.id));
  /* Children hang off a pinned parent rather than joining the general grid:
     they are evidence that answering opened something new, so they belong
     next to the answer that caused them. */
  const childrenOf = (id: string) => cards.filter((c) => c.parentId === id);
  const childIds = new Set(cards.filter((c) => c.parentId).map((c) => c.id));
  const rest = cards.filter((c) => !pinnedIds.has(c.id) && !childIds.has(c.id));

  return (
    <aside
      aria-label="Questions on the wall"
      className="flex min-w-0 flex-col gap-2.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-plum">On the wall</h2>
        <span className="text-[11px] tabular-nums text-ink-soft">
          {cards.length} question{cards.length === 1 ? "" : "s"}
        </span>
      </div>

      {cards.length === 0 && (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-ink/15 px-3 text-center text-sm italic text-ink-soft">
          Nothing on the wall yet.
        </p>
      )}

      {pinned.length > 0 && (
        <section aria-label="The three prioritised questions">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-moss-deep">
            <Pin size={11} aria-hidden="true" /> The three we chose
          </p>
          {/* Square notes side by side — the three read as one decision, not
              as a vertical list. Any question an answer opened hangs beneath
              its parent, indented by the moss rule. */}
          <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 border-l-2 border-moss/40 pl-2">
            {pinned.map((q, i) => (
              <div key={q.id} className="flex min-w-0 flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  <Note card={q} index={i} reduced={!!reduced} />
                  {childrenOf(q.id).map((child, j) => (
                    <Child key={child.id} card={child} index={j} reduced={!!reduced} />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-label="Other questions raised">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">
            {pinned.length > 0 ? "Everything else raised" : "Raised so far"}
          </p>
          {/* Square notes laid out as a dense grid, so the wall reads as tiles
              spreading across the surface as the story advances. */}
          <ul className="grid grid-cols-3 gap-1.5">
            <AnimatePresence initial={false}>
              {rest.map((q, i) => (
                <Row key={q.id} card={q} index={i} reduced={!!reduced} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </aside>
  );
}

/** A full sticky note — used only for the three chosen questions. */
function Note({
  card: q,
  index,
  reduced,
}: {
  card: WallCard;
  index: number;
  reduced: boolean;
}) {
  const settled = q.status === "answered" || q.status === "discarded";
  return (
    <motion.article
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, x: 14, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
      transition={reduced ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
      style={{ rotate: `${(index % 2 === 0 ? -1 : 1) * 0.8}deg` }}
      className={`story-note flex min-h-[5.5rem] flex-col rounded-[3px] border p-2 shadow-sm ${
        settled ? "border-ink/15 bg-note/45 opacity-75" : "border-note-edge bg-note ring-1 ring-moss/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-[11px] font-bold text-plum">{q.id}</span>
        {!UNSTAMPED.has(q.status) && STATUS_CLASS[q.status] && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ${STATUS_CLASS[q.status]}`}
          >
            {q.status}
          </span>
        )}
      </div>
      <p
        className={`mt-0.5 text-[11px] leading-[1.25] ${
          settled ? "text-ink-soft line-through decoration-ink/40" : "text-ink"
        }`}
      >
        {q.text}
      </p>
      {q.outcome && (
        /* Red and unclamped: an answer is the payoff of the note, so it must
           read in full rather than trail off as an ellipsis. */
        <p className="mt-1 border-t border-marker/25 pt-0.5 text-[9px] font-medium leading-[1.25] text-marker">
          <span className="font-semibold">→ </span>
          {q.outcome}
        </p>
      )}
      <p className="mt-auto pt-0.5 text-[9px] text-ink-soft">
        {q.fromId && <span className="mr-1.5">↳ {q.fromId}</span>}
        {q.owner && <span>{q.owner}</span>}
      </p>
      {settled && (
        <span className="sr-only">{q.status === "discarded" ? "Discarded" : "Answered"}</span>
      )}
    </motion.article>
  );
}

/** A question that only exists because its parent was answered. Rendered
 *  smaller and tighter, tucked under the pinned note that caused it, so the
 *  viewer can see a prioritised question generate new inquiry. */
function Child({
  card: q,
  index,
  reduced,
}: {
  card: WallCard;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: -6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.94 }}
      transition={reduced ? { duration: 0 } : { duration: 0.26, ease: "easeOut" }}
      style={{ rotate: `${(index % 2 === 0 ? 1 : -1) * 0.6}deg` }}
      className="story-note rounded-[3px] border border-dashed border-teal/50 bg-white/85 p-1.5 pl-2 shadow-sm"
    >
      <p className="flex items-baseline gap-1 text-[8px] font-bold uppercase tracking-wide text-teal-deep">
        <span className="text-plum">{q.id}</span>
        <span className="font-medium normal-case tracking-normal text-ink-soft">
          new question
        </span>
      </p>
      <p className="mt-0.5 text-[9px] leading-[1.2] text-ink">{q.text}</p>
      <span className="sr-only">Raised by answering {q.parentId}</span>
    </motion.div>
  );
}

/** A compact row, so fourteen questions can share the column without scrolling. */
function Row({
  card: q,
  index,
  reduced,
}: {
  card: WallCard;
  index: number;
  reduced: boolean;
}) {
  const settled = q.status === "answered" || q.status === "discarded";

  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
      style={{ rotate: `${(index % 2 === 0 ? -1 : 1) * 0.5}deg` }}
      className={`story-note flex min-h-[4.5rem] flex-col justify-start rounded-[3px] border p-1.5 shadow-sm ${
        settled ? "border-ink/12 bg-note/40 opacity-70" : "border-note-edge bg-note"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="shrink-0 font-display text-[9.5px] font-bold text-plum">{q.id}</span>
        {!UNSTAMPED.has(q.status) && STATUS_CLASS[q.status] && (
          <span
            className={`shrink-0 rounded-full px-1 text-[7px] font-bold uppercase tracking-wide ${STATUS_CLASS[q.status]}`}
          >
            {q.status}
          </span>
        )}
      </div>
      <p
        className={`mt-0.5 text-[9.5px] leading-[1.2] ${
          settled ? "text-ink-soft line-through decoration-ink/40" : "text-ink"
        }`}
      >
        {q.text}
      </p>
      {q.outcome && (
        <p className="mt-0.5 text-[8px] font-medium leading-[1.2] text-marker">
          <span className="font-semibold">→ </span>
          {q.outcome}
        </p>
      )}
      {settled && (
        <span className="sr-only">{q.status === "discarded" ? "Discarded" : "Answered"}</span>
      )}
    </motion.li>
  );
}
