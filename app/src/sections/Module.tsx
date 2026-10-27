import { useState } from "react";
import { Sparkles } from "lucide-react";
import SectionShell from "../components/SectionShell";
import TextField from "../components/TextField";
import { S6 } from "../content";
import { useSession } from "../session";

/**
 * S6 — "Your Module" reflection (Task 10).
 * Four autosaved TextFields bound to responses["6"][field]; Continue gates on
 * the three required answers (trimmed non-empty — the optional field never
 * blocks). Wide screens: framing + live-session hint in a side rail while the
 * fields span two columns; single column on mobile.
 */
export default function Module() {
  const { responses, saveResponse, markCompleted } = useSession();
  const saved = responses["6"] ?? {};
  // Drafts overlay the session values: fields initialise from saved responses
  // (resume) and typing stays responsive ahead of the debounced autosave.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const valueOf = (name: string) => drafts[name] ?? saved[name] ?? "";
  const setValue = (name: string, v: string) =>
    setDrafts((d) => ({ ...d, [name]: v }));

  const allRequired = S6.fields
    .filter((f) => f.required)
    .every((f) => valueOf(f.name).trim().length > 0);

  return (
    <SectionShell id={6} canContinue={allRequired} onContinue={() => markCompleted(6)}>
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <aside aria-label="About this reflection" className="self-start lg:sticky lg:top-20">
          <p className="text-[15px] leading-relaxed text-ink-soft">{S6.framing}</p>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-teal/20 bg-cream-deep/70 px-4 py-3">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden={true} />
            <p className="text-xs leading-relaxed text-ink-soft">
              Your answers feed straight into the live session — the trainer uses
              them to shape the workshop discussion.
            </p>
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-2">
          {S6.fields.map((f) => (
            <TextField
              key={f.name}
              label={f.label}
              value={valueOf(f.name)}
              onChange={(v) => setValue(f.name, v)}
              onSave={(v) => saveResponse(6, f.name, v)}
              long={f.long}
              required={f.required}
              minChars={f.long ? 20 : 2}
            />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
