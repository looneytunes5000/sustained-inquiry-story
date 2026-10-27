import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SectionShell from "../components/SectionShell";
import TextField from "../components/TextField";
import { PROVOCATION, S1 } from "../content";
import { useSession } from "../session";

/**
 * S1 — The Provocation (spec §4-S1). While the client's video does not exist,
 * the spec's own Appendix A fallback ships: the same topic taught two ways, as
 * two written scenarios the trainee can actually reflect on. Flipping
 * video.enabled in api/config.php swaps the scenarios for the real clip.
 * The reflection is required (non-empty, trimmed) and autosaved on blur + 10 s.
 */
export default function Video() {
  const { responses, saveResponse, markCompleted, config } = useSession();
  const video = config?.video;
  // Initialise from saved responses so a returning trainee sees their answer.
  const [value, setValue] = useState(() => responses["1"]?.[S1.reflectionField] ?? "");
  const filled = value.trim().length > 0;

  return (
    <SectionShell
      id={1}
      canContinue={filled}
      continueLabel={filled ? "Continue" : "Write your reflection to continue"}
      onContinue={() => {
        // Save immediately on Continue, independent of the autosave timers.
        void saveResponse(1, S1.reflectionField, value);
        markCompleted(1);
      }}
    >
      {video?.enabled ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <video
            controls={true}
            src={video.url || undefined}
            aria-label="Provocation video"
            className="size-full"
          >
            {video.captions_url ? (
              <track
                kind="captions"
                src={video.captions_url}
                srcLang="en"
                label="English captions"
                default={true}
              />
            ) : null}
          </video>
        </div>
      ) : (
        <>
          <p className="mb-5 max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
            {PROVOCATION.framing}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {PROVOCATION.scenarios.map((s, i) => {
              const accent = s.tone === "accent";
              return (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08, ease: "easeOut" }}
                  aria-labelledby={`scenario-${s.id}`}
                  className={`flex flex-col rounded-2xl border p-6 ${
                    accent
                      ? "border-teal/30 bg-white shadow-sm"
                      : "border-ink/10 bg-cream-deep/60"
                  }`}
                >
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                      accent ? "bg-teal-deep text-white" : "bg-ink/8 text-ink-soft"
                    }`}
                  >
                    {accent && <Check size={11} strokeWidth={3.5} aria-hidden={true} />}
                    {s.label}
                  </span>
                  <h2
                    id={`scenario-${s.id}`}
                    className={`mt-3 font-display text-xl ${accent ? "text-plum" : "text-ink"}`}
                  >
                    {s.title}
                  </h2>
                  <p
                    className={`mt-2.5 text-[15px] leading-relaxed ${
                      accent ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {s.body}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8">
        <TextField
          label={S1.reflectionPrompt}
          value={value}
          onChange={setValue}
          onSave={(v) => saveResponse(1, S1.reflectionField, v)}
          long={true}
          required={true}
        />
      </div>
    </SectionShell>
  );
}
