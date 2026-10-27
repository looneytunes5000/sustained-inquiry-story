import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SECTIONS, type SectionId } from "../content";
import { useSession } from "../session";
import CheckBadge from "./CheckBadge";

interface ShellProps {
  id: SectionId;
  titleOverride?: string;
  children: React.ReactNode;
  /** Disable Continue until this is true (section-specific completion gate). */
  canContinue?: boolean;
  continueLabel?: string;
  onContinue?: () => void;
}

/** Per-section chrome: kicker + title, started ping, Back/Continue controls. */
export default function SectionShell({
  id,
  titleOverride,
  children,
  canContinue = true,
  continueLabel = "Continue",
  onContinue,
}: ShellProps) {
  const section = SECTIONS.find((s) => s.id === id)!;
  const { markStarted, isComplete } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    markStarted(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const idx = SECTIONS.findIndex((s) => s.id === id);
  const prev = SECTIONS.slice(0, idx).reverse().find((s) => !s.phase2);
  const next = SECTIONS.slice(idx + 1).find((s) => !s.phase2);

  const handleContinue = () => {
    onContinue?.();
    if (next) navigate(next.route);
    else navigate("/done");
  };

  return (
    <article aria-labelledby={`section-${id}-title`}>
      <header className="mb-6 flex items-start gap-4">
        <CheckBadge done={isComplete(id)} size={34} className="mt-1" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
            {section.kicker}
          </p>
          <h1
            id={`section-${id}-title`}
            className="mt-1 text-3xl font-semibold text-plum sm:text-4xl"
          >
            {titleOverride ?? section.title}
          </h1>
        </div>
      </header>

      {children}

      <footer className="mt-10 flex items-center justify-between border-t border-ink/10 pt-5 no-print">
        {prev ? (
          <Link
            to={prev.route}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-cream-deep"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-plum disabled:cursor-not-allowed disabled:opacity-40"
        >
          {continueLabel} <ArrowRight size={16} />
        </button>
      </footer>
    </article>
  );
}
