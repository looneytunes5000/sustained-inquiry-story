import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Clock, MapPin, Printer } from "lucide-react";
import { REQUIRED_SECTIONS, SECTIONS, S6 } from "../content";
import { firstAttemptScore } from "../quiz";
import { useSession } from "../session";

/**
 * S7 — completion recap + print summary (spec §4-S7).
 * Quiet celebration per spec §9: the only flourish is a single SVG
 * stroke draw-in on the check, disabled for reduced-motion users and in print.
 */

const MODULE_FIELD_NAMES = ["module_topic", "module_problem", "module_entry_event"] as const;

/** Draw-in animation for the completion check (inline keyframes; stroke-dashoffset). */
const DRAW_CSS = `
.done-draw-circle { stroke-dasharray: 208; stroke-dashoffset: 0; }
.done-draw-check { stroke-dasharray: 43; stroke-dashoffset: 0; }
@media (prefers-reduced-motion: no-preference) {
  .done-draw-circle { animation: done-circle-draw 0.8s ease-out both; }
  .done-draw-check { animation: done-check-draw 0.5s ease-out 0.6s both; }
  .done-badge-halo { animation: done-halo-in 0.9s ease-out both; }
}
@keyframes done-circle-draw { from { stroke-dashoffset: 208; } to { stroke-dashoffset: 0; } }
@keyframes done-check-draw { from { stroke-dashoffset: 43; } to { stroke-dashoffset: 0; } }
@keyframes done-halo-in { from { opacity: 0; } }
`;

/** The big completion check — SVG circle + check stroke draw-in (CheckBadge motif, enlarged). */
function DoneBadge() {
  return (
    <svg viewBox="0 0 80 80" width={88} height={88} aria-hidden={true} className="shrink-0">
      <circle
        className="done-badge-halo"
        cx="40"
        cy="40"
        r="37"
        fill="var(--color-moss)"
        opacity="0.12"
      />
      <circle
        className="done-draw-circle"
        cx="40"
        cy="40"
        r="33"
        fill="none"
        stroke="var(--color-moss)"
        strokeWidth="4"
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <path
        className="done-draw-check"
        d="M26 41.5 L36.5 52 L55 31.5"
        fill="none"
        stroke="var(--color-moss)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** S7 — completion recap + print summary. */
export default function Done() {
  const { user, responses, quiz, config, isComplete } = useSession();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-ink-soft">
          <Link to="/" className="font-semibold text-teal-deep underline">
            Start here
          </Link>{" "}
          to begin the pre-session prep.
        </p>
      </main>
    );
  }

  const missing = REQUIRED_SECTIONS.filter((id) => !isComplete(id));

  // Guard: required sections (1, 2, 4, 6) gate the recap — friendly redirect, not an error.
  if (missing.length > 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border-2 border-dashed border-teal/40 bg-white/60 p-8 sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal-deep">
            <ClipboardList size={26} aria-hidden={true} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-plum sm:text-3xl">
            A little more to explore
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            This page becomes your session summary once every required section is complete. Finish{" "}
            {missing.length === 1 ? "this section" : "these sections"} first:
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {missing.map((id) => {
              const s = SECTIONS.find((x) => x.id === id)!;
              return (
                <li key={id}>
                  <Link
                    to={s.route}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-ink/10 transition-all hover:ring-teal"
                  >
                    <span className="font-display text-sm font-semibold text-teal-deep">
                      Section {id}
                    </span>
                    <span className="text-[15px] font-medium text-ink">{s.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    );
  }

  const score = firstAttemptScore(quiz);
  const moduleResponses = responses["6"] ?? {};
  const session = config?.session;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <style>{DRAW_CSS}</style>
      <div className="print-summary rounded-2xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-ink-soft">
          {user.name} · {user.email}
          {user.subject_area ? ` · ${user.subject_area}` : ""}
        </p>

        <div className="mt-4 flex items-start gap-5">
          <DoneBadge />
          <h1 className="pt-1 text-2xl font-semibold leading-snug text-plum sm:text-[2rem]">
            You're ready for the session! Here's a summary of what you explored.
          </h1>
        </div>

        {/* Framed positively per spec: gaps become "live coverage", never a grade. */}
        <div className="mt-8 rounded-xl bg-moss/10 px-5 py-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
            Self-check quiz
          </h2>
          <p className="mt-1 text-[15px] font-medium text-ink">
            {score === 3
              ? "You got 3/3 — great grasp of the core ideas"
              : `You got ${score}/3 — we'll cover this idea again live`}
          </p>
        </div>

        <section aria-labelledby="done-module-title" className="mt-8">
          <h2
            id="done-module-title"
            className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep"
          >
            Your module reflection
          </h2>
          <dl className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
            {MODULE_FIELD_NAMES.map((name) => {
              const label = S6.fields.find((f) => f.name === name)?.label ?? name;
              const value = moduleResponses[name]?.trim();
              return (
                <div key={name} className="grid gap-1 py-3.5 sm:grid-cols-[15rem_1fr] sm:gap-4 lg:grid-cols-[18rem_1fr]">
                  <dt className="text-sm font-semibold text-ink">{label}</dt>
                  <dd className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                    {value || "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section aria-labelledby="done-session-title" className="mt-8">
          <h2
            id="done-session-title"
            className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep"
          >
            Live session
          </h2>
          <dl className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-cream/60">
            {(
              [
                { Icon: CalendarDays, label: "Date", value: session?.date },
                { Icon: Clock, label: "Time", value: session?.time },
                { Icon: MapPin, label: "Venue", value: session?.venue },
              ] as const
            ).map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3">
                <Icon size={16} aria-hidden={true} className="shrink-0 text-teal-deep" />
                <dt className="w-14 shrink-0 text-sm font-semibold text-ink-soft">{label}</dt>
                <dd className="text-[15px] font-medium text-ink">{value || "TBC"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="no-print mt-8 flex flex-wrap items-center gap-4 border-t border-ink/10 pt-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-plum"
          >
            <Printer size={16} aria-hidden={true} /> Print summary
          </button>
          <p className="text-sm text-ink-soft">Print it and bring it along to the live session.</p>
        </div>
      </div>
    </main>
  );
}
