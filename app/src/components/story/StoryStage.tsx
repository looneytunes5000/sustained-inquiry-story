import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import type { StoryScene } from "../../data/story-manifest";

/**
 * The panel: image in a paper frame, optional caption strip beneath, and — on a
 * genuine media failure only — a blocking card with Retry and a way out.
 */
export default function StoryStage({
  scene,
  captions,
  showError,
  showAlt,
  onRetry,
  onLeave,
}: {
  scene: StoryScene;
  captions: boolean;
  showError: boolean;
  /* True once a scene with a second panel has played past its midpoint. */
  showAlt?: boolean;
  onRetry: () => void;
  onLeave: () => void;
}) {
  const alt = showAlt && scene.imageAlt ? scene.imageAlt : null;
  return (
    <div className="relative">
      <figure className="overflow-hidden rounded-xl border border-ink/10 bg-white p-2 shadow-md">
        <div className="relative">
          <img
            src={scene.image}
            alt={scene.title}
            className={`block w-full rounded-lg transition-opacity duration-500 ${
              alt ? "opacity-0" : "opacity-100"
            }`}
            draggable={false}
          />
          {scene.imageAlt && (
            <img
              src={scene.imageAlt}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 size-full rounded-lg object-cover transition-opacity duration-500 ${
                alt ? "opacity-100" : "opacity-0"
              }`}
              draggable={false}
            />
          )}
        </div>
        <figcaption className="sr-only">{scene.title}</figcaption>
      </figure>

      {captions && (
        <div
          data-testid="caption-strip"
          className="mt-2 rounded-lg bg-ink px-4 py-3 text-[14px] leading-relaxed text-cream"
        >
          {scene.transcript ? (
            scene.transcript
          ) : (
            <span className="opacity-70">Caption script for this scene is not loaded yet.</span>
          )}
        </div>
      )}

      {showError && (
        <div
          role="alert"
          className="absolute inset-0 grid place-items-center rounded-xl bg-cream/95 p-6"
        >
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto text-orange" size={28} aria-hidden="true" />
            <p className="mt-3 font-display text-xl text-plum">
              This scene's narration didn't load
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              The story can't continue until the audio plays. Check your connection, then
              retry.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-deep/90"
              >
                <RotateCcw size={16} aria-hidden="true" /> Retry
              </button>
              <button
                type="button"
                onClick={onLeave}
                className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft underline decoration-ink/30 underline-offset-4 hover:text-plum"
              >
                <ArrowLeft size={16} aria-hidden="true" /> Leave the story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
