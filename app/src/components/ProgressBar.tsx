import { REQUIRED_SECTIONS } from "../content";
import { useSession } from "../session";

/** Overall progress bar — n of required sections complete (spec §4-S0). */
export default function ProgressBar() {
  const { completedCount } = useSession();
  const total = REQUIRED_SECTIONS.length;
  const pct = Math.round((completedCount / total) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completedCount}
      aria-valuetext={`${completedCount} of ${total} sections complete`}
      className="flex items-center gap-3"
    >
      <div className="h-2.5 w-40 overflow-hidden rounded-full bg-ink/10 sm:w-56">
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-ink-soft tabular-nums">
        {completedCount}/{total}
      </span>
    </div>
  );
}
