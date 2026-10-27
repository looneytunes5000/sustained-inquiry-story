import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

/** Begin gate: the user gesture browsers require before narration may play,
 *  plus the expectations and the resume fork.
 *
 *  The opening clip loops, with sound. Browsers refuse audible autoplay until
 *  the page has been interacted with, so the attempt is unmuted first and
 *  falls back to a muted loop if it is refused — the clip always plays, and
 *  the native controls let anyone turn the sound on. Visitors who asked for
 *  reduced motion get a still poster instead. */
export default function StoryBegin({
  resumeFrom,
  onBegin,
  onRestart,
}: {
  resumeFrom: number | null;
  onBegin: () => void;
  onRestart: () => void;
}) {
  const reduced = useReducedMotion();
  const video = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = video.current;
    if (!el || reduced) return;
    el.muted = false;
    const attempt = el.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        // Audible autoplay refused: keep the loop, give up the sound.
        el.muted = true;
        void el.play().catch(() => {});
      });
    }
  }, [reduced]);

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <video
        ref={video}
        src="/story/opening.mp4"
        autoPlay={!reduced}
        loop
        playsInline
        controls
        preload="auto"
        aria-label="Story opening"
        className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-ink/10 bg-black shadow-md"
      />
      <h2 className="mt-4 font-display text-4xl leading-tight text-plum">
        Would you let your brother swim there?
      </h2>
      <div className="mt-8 flex flex-col items-center gap-3">
        {resumeFrom ? (
          <>
            <button
              type="button"
              onClick={onBegin}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-7 py-3 text-base font-semibold text-white shadow-sm hover:bg-teal-deep/90"
            >
              <Play size={18} aria-hidden="true" /> Continue from scene {resumeFrom}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="text-sm font-medium text-ink-soft underline decoration-ink/30 underline-offset-4 hover:text-plum"
            >
              Start from the beginning
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onBegin}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-7 py-3 text-base font-semibold text-white shadow-sm hover:bg-teal-deep/90"
          >
            <Play size={18} aria-hidden="true" /> Begin
          </button>
        )}
      </div>
      <p className="mt-6 text-xs text-ink-soft">About 8 minutes</p>
    </div>
  );
}
