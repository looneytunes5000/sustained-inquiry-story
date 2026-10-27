import { useId } from "react";
import { useState } from "react";
import { Check } from "lucide-react";
import { useAutosave } from "../session";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => Promise<void> | void;
  long?: boolean;
  required?: boolean;
  hint?: string;
  minChars?: number;
}

/**
 * Labelled input/textarea with autosave (blur + 10s debounce) and a
 * saved indicator. Autosave semantics per spec §4-S1.
 */
export default function TextField({
  label,
  value,
  onChange,
  onSave,
  long = false,
  required = false,
  hint,
  minChars = 0,
}: TextFieldProps) {
  const { status, flush } = useAutosave(value, onSave);
  // Don't flag an untouched field as needing attention — only after the
  // trainee has interacted with it (blur) is an empty required field a problem.
  const [touched, setTouched] = useState(false);
  const tooShort = required && touched && value.trim().length < Math.max(1, minChars);
  const markTouchedAndFlush = () => {
    setTouched(true);
    void flush();
  };
  // Label ↔ control association: the accessible name comes from the label, and
  // clicking it focuses the field (WCAG 1.3.1 / 4.1.2).
  const id = useId();

  const savedIndicator =
    status === "saving" ? (
      <span className="text-xs text-ink-soft">Saving…</span>
    ) : status === "saved" ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-moss-deep">
        <Check size={12} strokeWidth={3} /> Saved
      </span>
    ) : null;

  return (
    <div className="mb-6">
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">
          {label}
          {required && (
            <span aria-hidden={true} className="ml-1 text-plum">
              *
            </span>
          )}
        </span>
        {savedIndicator}
      </label>
      {long ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={markTouchedAndFlush}
          rows={4}
          aria-required={required}
          aria-invalid={tooShort}
          className={`w-full resize-y rounded-xl border-2 bg-white px-4 py-3 text-[15px] leading-relaxed transition-colors placeholder:text-ink/30 focus:outline-none ${
            tooShort ? "border-orange/60" : "border-ink/15 focus:border-teal"
          }`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={markTouchedAndFlush}
          aria-required={required}
          aria-invalid={tooShort}
          className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-[15px] transition-colors placeholder:text-ink/30 focus:outline-none ${
            tooShort ? "border-orange/60" : "border-ink/15 focus:border-teal"
          }`}
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
      {tooShort && minChars > 1 && value.trim().length > 0 && (
        <p className="mt-1 text-xs text-orange-deep">Add a little more detail ({minChars}+ characters).</p>
      )}
    </div>
  );
}
