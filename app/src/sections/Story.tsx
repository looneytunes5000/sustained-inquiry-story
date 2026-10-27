import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../session";
import {
  BIG_QUESTION,
  STORY_SCENES,
  type SceneId,
  type StageDef,
} from "../data/story-manifest";
import {
  furthestFromResponses,
  isStageUnlocked,
  nextScene,
  prevScene,
  stageForScene,
} from "../data/story";
import StoryBegin from "../components/story/StoryBegin";
import StoryTimeline from "../components/story/StoryTimeline";
import StoryStage from "../components/story/StoryStage";
import StoryRail from "../components/story/StoryRail";
import StoryPlayer from "../components/story/StoryPlayer";
import StoryEndCard from "../components/story/StoryEndCard";
import { useStoryAudio } from "../components/story/useStoryAudio";

const ease = { duration: 0.25, ease: "easeOut" as const };
const STORY_FIELD = "story_furthest";

/**
 * /story — full-screen visual story. Deliberately outside AppShell: no app nav
 * during playback. Requires an entered session so furthest-scene persists
 * server-side; deep links without one bounce to the landing page.
 *
 * Phase machine: begin (gesture gate) → playing → ended (end card). The hook
 * never calls play() itself — the Begin click is the user gesture, and every
 * scene change re-triggers play() from here.
 */
export interface StoryShell {
  /* Whether the host is still resolving who the viewer is. */
  ready: boolean;
  /* False sends the viewer away (the app's session gate); the standalone
   * build has no gate and always reports true. */
  admitted: boolean;
  responses: Record<string, Record<string, string>>;
  saveFurthest: (value: string) => void;
  exit: () => void;
  /* Rendered instead of the Begin gate's own intro copy, if the host has one. */
  exitLabel?: string;
}

/** The app's binding: session-backed progress, and "/" as the exit. */
export function useAppStoryShell(): StoryShell {
  const { ready, user, responses, saveResponse } = useSession();
  const navigate = useNavigate();

  // Stable identities: the screen keys effects on these, so a fresh function
  // every render would re-bind the keyboard listener on each paint.
  const saveFurthest = useCallback(
    (value: string) => {
      // Best-effort: session state stays correct even if the PUT fails.
      saveResponse(0, STORY_FIELD, value).catch(() => {});
    },
    [saveResponse],
  );
  const exit = useCallback(() => navigate("/"), [navigate]);

  return useMemo(
    () => ({ ready, admitted: !!user, responses, saveFurthest, exit, exitLabel: "Back" }),
    [ready, user, responses, saveFurthest, exit],
  );
}

/**
 * The story screen. Everything below is host-agnostic: the app and the
 * published standalone build render this same component and differ only in
 * the shell passed in.
 */
export default function Story({ shell }: { shell: StoryShell }) {
  const { ready, admitted, responses, saveFurthest, exit, exitLabel = "Back" } = shell;
  const reduced = useReducedMotion();

  const savedFurthest = useMemo(() => furthestFromResponses(responses), [responses]);
  const [furthest, setFurthest] = useState<SceneId>(savedFurthest);
  const [phase, setPhase] = useState<"begin" | "playing" | "ended">("begin");
  const [scene, setScene] = useState<SceneId>(savedFurthest);
  const [captions, setCaptions] = useState(false);
  const [lockedStage, setLockedStage] = useState<StageDef | null>(null);

  const sceneDef = STORY_SCENES[scene - 1];
  const stage = stageForScene(scene);
  const audio = useStoryAudio(sceneDef.audio);
  // A scene with two panels cross-fades to the second at its midpoint.
  const showAlt =
    !!sceneDef.imageAlt && audio.duration > 0 && audio.elapsed >= audio.duration / 2;

  // Furthest reached is monotonic: revisiting an earlier scene never relocks.
  // A ref (not the state) drives the comparison so the ended callback never
  // acts on a stale furthest, and saveResponse stays out of state updaters.
  const furthestRef = useRef(furthest);
  furthestRef.current = furthest;
  const reach = useCallback(
    (id: SceneId) => {
      if (id <= furthestRef.current) return;
      furthestRef.current = id;
      setFurthest(id);
      saveFurthest(String(id));
    },
    [saveFurthest],
  );

  /** Manual scene stepping (buttons and arrow keys). Going forward through
   *  the last scene ends the story rather than stopping silently. */
  const stepTo = useCallback(
    (id: SceneId | null) => {
      if (id === null) {
        setPhase("ended");
        return;
      }
      setScene(id);
      reach(id);
    },
    [reach],
  );

  /** Stage clicks start that stage at its opening scene. */
  const goToStage = useCallback(
    (target: StageDef) => {
      const first = target.sceneIds[0];
      if (first === undefined || !isStageUnlocked(target, furthest)) {
        setLockedStage(target);
        return;
      }
      setLockedStage(null);
      setScene(first);
    },
    [furthest],
  );

  // Advance when the narration ends; stop at the end card.
  useEffect(() => {
    return audio.onEnded(() => {
      const next = nextScene(scene);
      if (next) {
        setScene(next);
        reach(next);
      } else {
        setPhase("ended");
      }
    });
    // re-register whenever the scene (and therefore the track) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, audio.onEnded]);

  // Start each scene's audio once in the playing phase. audio.play changes
  // identity when the <audio> node mounts, so this re-fires and actually plays.
  // audio.nonce covers Retry: the bump re-binds the element and swaps the src,
  // and this effect re-invokes play() so playback resumes on the same scene.
  useEffect(() => {
    if (phase === "playing") void audio.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, phase, audio.play, audio.nonce]);

  useEffect(() => {
    setLockedStage(null);
  }, [scene]);

  // Keyboard: Left/Right scene, Space play, C captions, M mute, Esc exit.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // Ctrl/Cmd/Alt combos keep their browser meanings (copy, mute, history).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        // Arrows double as the timeline rail's navigation keys when a chip has
        // focus — without preventDefault they also scroll the rail.
        e.preventDefault();
        stepTo(nextScene(scene));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (scene > 1) stepTo(prevScene(scene));
      } else if (e.key === " ") {
        e.preventDefault();
        if (audio.playing) audio.pause();
        else void audio.play();
      } else if (e.key.toLowerCase() === "c") {
        setCaptions((c) => !c);
      } else if (e.key.toLowerCase() === "m") {
        audio.toggleMute();
      } else if (e.key === "Escape") {
        exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, scene, stepTo, audio.playing, audio.play, audio.pause, audio.toggleMute, exit]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream">
        <span
          role="status"
          aria-label="Loading"
          className="size-10 animate-spin rounded-full border-[3px] border-teal border-t-transparent"
        />
      </main>
    );
  }
  // The app's shell redirects itself when unadmitted; this is a belt-and-
  // braces guard for any other host. Navigation belongs in an effect — calling
  // it during render makes React Router warn and can drop the update.
  useEffect(() => {
    if (ready && !admitted) exit();
  }, [ready, admitted, exit]);

  if (!admitted) return null;

  return (
    <main className="story-paper min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => exit()}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-plum"
        >
          <ArrowLeft size={16} aria-hidden="true" /> {exitLabel}
        </button>
        <h1 className="font-display text-base text-plum sm:text-lg">
          Sustained Inquiry · The Story
        </h1>
        <span className="w-16" aria-hidden="true" />
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {phase === "begin" && (
          <StoryBegin
            resumeFrom={savedFurthest > 1 ? savedFurthest : null}
            onBegin={() => setPhase("playing")}
            onRestart={() => {
              setScene(1);
              setPhase("playing");
            }}
          />
        )}

        {phase === "playing" && (
          <>
            {/* The rail runs across the middle of the screen; the video grows
                out of it below, with the wall flanking it left and right. */}
            <StoryTimeline
              current={stage.id}
              furthest={furthest}
              onSelect={goToStage}
              onLockedSelect={setLockedStage}
            />

            {lockedStage && (
              <p role="status" className="mt-1 text-center text-sm text-orange-deep">
                Watch to here first — {lockedStage.label} unlocks once you reach it.
              </p>
            )}

            {/* Video left, wall right. The wall is a single column with the
                three prioritised questions pinned at its top, so the eye can
                hold "what we chose" while the rest of the trail moves past
                underneath. Video stays first in the DOM so the stacked layout
                reads video → notes. */}
            <div className="mt-5 grid gap-x-5 gap-y-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <div className="min-w-0">
                <section
                  aria-label="Big Question"
                  className="mb-3 rounded-lg border-l-4 border-marker bg-cream-deep/70 px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-deep">
                    Big Question
                  </p>
                  <p className="mt-1 font-display text-[15px] leading-snug text-ink sm:text-base">
                    {BIG_QUESTION}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-soft">
                    Would you let your brother swim there?
                  </p>
                </section>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={reduced ? { duration: 0 } : ease}
                  >
                    <StoryStage
                      scene={sceneDef}
                      captions={captions}
                      showError={audio.error}
                      showAlt={showAlt}
                      onRetry={audio.retry}
                      onLeave={() => exit()}
                    />
                  </motion.div>
                </AnimatePresence>

                <StoryPlayer
                  playing={audio.playing}
                  muted={audio.muted}
                  captions={captions}
                  onTogglePlay={() => (audio.playing ? audio.pause() : void audio.play())}
                  onReplay={audio.replay}
                  onToggleMute={audio.toggleMute}
                  onToggleCaptions={() => setCaptions((c) => !c)}
                  onExit={() => exit()}
                  onPrev={() => stepTo(prevScene(scene))}
                  onNext={() => stepTo(nextScene(scene))}
                  canPrev={scene > 1}
                  onSeek={audio.seek}
                  elapsed={audio.elapsed}
                  duration={audio.duration}
                />

                {/* The hook sets src imperatively; a JSX src would fight the
                    rebind effect on re-render. */}
                <audio ref={audio.el} hidden aria-hidden="true" />
              </div>

              <StoryRail scene={scene} />
            </div>
          </>
        )}

        {phase === "ended" && (
          <StoryEndCard
            onReplay={() => {
              setScene(1);
              setPhase("playing");
            }}
            onExit={() => exit()}
          />
        )}
      </div>

      <p className="sr-only" role="status">
        {phase === "playing" ? `Scene ${scene}: ${sceneDef.title}` : ""}
      </p>
    </main>
  );
}
