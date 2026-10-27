import { Check } from "lucide-react";

/** Circular green check — the motif inherited from the PBL reference site. */
export default function CheckBadge({
  done,
  size = 24,
  className = "",
}: {
  done: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden={true}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
        done ? "border-moss bg-moss text-white" : "border-ink/20 bg-transparent text-transparent"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.62} strokeWidth={3.5} />
    </span>
  );
}
