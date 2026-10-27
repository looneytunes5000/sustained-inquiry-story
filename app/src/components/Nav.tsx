import { NavLink } from "react-router-dom";
import { Lock } from "lucide-react";
import { SECTIONS } from "../content";
import { useSession } from "../session";
import CheckBadge from "./CheckBadge";

/**
 * Left-side navigation (spec §3): every section independently accessible,
 * completion checkmark per section, phase-2 items locked.
 */
export default function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { isComplete, user } = useSession();
  return (
    <nav aria-label="Sections" className="flex flex-col gap-1">
      {SECTIONS.map((s) => {
        if (s.phase2) {
          return (
            <span
              key={s.id}
              aria-disabled={true}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink/35"
            >
              <CheckBadge done={false} size={20} />
              <span className="flex-1 text-sm font-medium">{s.title}</span>
              <span className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                <Lock size={10} /> Phase 2
              </span>
            </span>
          );
        }
        return (
          <NavLink
            key={s.id}
            to={s.route}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive ? "bg-teal/10 text-teal-deep" : "text-ink hover:bg-cream-deep"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <CheckBadge done={isComplete(s.id)} size={20} />
                <span className="flex-1 text-sm font-medium">{s.title}</span>
                {isActive && <span aria-hidden={true} className="h-1.5 w-1.5 rounded-full bg-teal" />}
              </>
            )}
          </NavLink>
        );
      })}
      {user && (
        <NavLink
          to="/done"
          onClick={onNavigate}
          className={({ isActive }) =>
            `mt-2 flex items-center gap-3 rounded-lg border-t border-ink/10 px-3 pt-3 pb-1 text-sm font-semibold transition-colors ${
              isActive ? "text-plum" : "text-ink-soft hover:text-plum"
            }`
          }
        >
          Finish → summary
        </NavLink>
      )}
    </nav>
  );
}
