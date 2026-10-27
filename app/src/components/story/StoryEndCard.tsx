import { ArrowRight, RotateCcw } from "lucide-react";
import { BIG_QUESTION, END_CARD, PRIORITY_QUESTION_IDS } from "../../data/story-manifest";
import { cardsAtScene, type WallCard } from "../../data/story";

const STATUS_CLASS: Record<string, string> = {
  reframed: "bg-teal/15 text-teal-deep",
  prioritised: "bg-moss/20 text-moss-deep",
  answered: "bg-moss/20 text-moss-deep",
  discarded: "bg-ink/8 text-ink-soft line-through",
  open: "bg-plum/10 text-plum",
};
const UNSTAMPED = new Set(["raised", "parked"]);
const PRIORITY = new Set(PRIORITY_QUESTION_IDS);

/**
 * Deliberate ending. The centre of it is a before/after of the wall itself:
 * five plain questions at scene 2 against the settled board at the close. The
 * comparison is the argument of the whole story — same big question, entirely
 * different set of things known — so it gets the width, and the prose stays
 * out of its way.
 */
export default function StoryEndCard({
  onReplay,
  onExit,
}: {
  onReplay: () => void;
  onExit: () => void;
}) {
  const before = cardsAtScene(2);
  const after = cardsAtScene(15);

  return (
    <section aria-label="Story end" className="mx-auto max-w-6xl py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-deep">
        End of the prototype
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-plum sm:text-4xl">
        {END_CARD.heading}
      </h2>

      <div className="mt-4 rounded-lg border-l-4 border-marker bg-cream-deep/70 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-deep">
          Big Question
        </p>
        <p className="mt-1 font-display text-base leading-snug text-ink">{BIG_QUESTION}</p>
        <p className="mt-2 text-sm text-ink-soft">{END_CARD.line}</p>
      </div>

      <h3 className="mt-9 font-display text-xl text-plum">The wall, then and now</h3>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        The same question, asked at the start and at the end. Nothing was added to the
        big question — everything around it changed.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <Board
          label="Before"
          note="Scene 2 · five questions, none of them checked"
          cards={before}
          emphasise={false}
        />
        <Board
          label="After"
          note="The close · what the class could say by the end"
          cards={after}
          emphasise={true}
        />
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        {before.length} questions raised → {after.length} on the board,{" "}
        {after.filter((c) => c.status === "answered").length} answered,{" "}
        {after.filter((c) => c.status === "discarded").length} dropped,{" "}
        {after.filter((c) => c.status === "open").length} still open.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90"
        >
          <RotateCcw size={16} aria-hidden="true" /> Watch again
        </button>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft underline decoration-ink/30 underline-offset-4 hover:text-plum"
        >
          Back to the app <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

/** One side of the comparison: a full sticky-note board under a caption. */
function Board({
  label,
  note,
  cards,
  emphasise,
}: {
  label: string;
  note: string;
  cards: WallCard[];
  emphasise: boolean;
}) {
  const pinned = cards.filter((c) => PRIORITY.has(c.id));
  const rest = cards.filter((c) => !PRIORITY.has(c.id));

  return (
    <section
      aria-label={`${label} — ${note}`}
      className={`rounded-xl border p-3 ${
        emphasise ? "border-moss/40 bg-cream-deep/50" : "border-ink/10 bg-white/60"
      }`}
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-display text-base font-semibold text-plum">{label}</h4>
        <span className="text-right text-[10px] leading-tight text-ink-soft">{note}</span>
      </header>

      {pinned.length > 0 && (
        <div className="mb-2 border-l-2 border-moss/40 pl-2">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-moss-deep">
            The three we chose
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {pinned.map((c, i) => (
              <EndNote key={c.id} card={c} index={i} small={pinned.length > 3} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {rest.map((c, i) => (
          <EndNote key={c.id} card={c} index={i} small />
        ))}
      </div>
    </section>
  );
}

/** A read-only note, colour-matched to the live wall. No animation: this is a
 *  record, not a reveal. */
function EndNote({ card: q, index, small }: { card: WallCard; index: number; small: boolean }) {
  const settled = q.status === "answered" || q.status === "discarded";
  return (
    <article
      style={{ rotate: `${(index % 2 === 0 ? -1 : 1) * (small ? 0.6 : 0.8)}deg` }}
      className={`story-note flex flex-col rounded-[3px] border p-1.5 shadow-sm ${
        settled
          ? "border-ink/15 bg-note/45 opacity-75"
          : "border-note-edge bg-note"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-display text-[9px] font-bold text-plum">{q.id}</span>
        {!UNSTAMPED.has(q.status) && STATUS_CLASS[q.status] && (
          <span
            className={`rounded-full px-1 text-[7px] font-bold uppercase tracking-wide ${STATUS_CLASS[q.status]}`}
          >
            {q.status}
          </span>
        )}
      </div>
      <p
        className={`mt-0.5 text-[9px] leading-[1.2] ${
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
      {q.owner && <p className="mt-0.5 text-[8px] text-ink-soft">{q.owner}</p>}
      {settled && (
        <span className="sr-only">{q.status === "discarded" ? "Discarded" : "Answered"}</span>
      )}
    </article>
  );
}
