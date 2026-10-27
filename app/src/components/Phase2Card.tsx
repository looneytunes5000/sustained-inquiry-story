import { Construction } from "lucide-react";
import { SECTIONS } from "../content";

/** Friendly placeholder for sections deferred to phase 2 (S3, S5). */
export function Phase2Card({ id }: { id: 3 | 5 }) {
  const section = SECTIONS.find((s) => s.id === id)!;
  return (
    <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-teal/40 bg-white/60 p-10 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal-deep">
        <Construction size={26} />
      </span>
      <h2 className="text-2xl font-semibold text-plum">{section.title}</h2>
      <p className="mt-2 text-sm text-ink-soft">
        This section arrives in the next build phase — it will not block your progress.
        Continue with the other sections first.
      </p>
    </div>
  );
}
