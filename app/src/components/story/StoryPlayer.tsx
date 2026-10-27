import type { ReactNode } from "react";
import {
  Captions,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

function IconButton({
  label,
  onClick,
  pressed,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cream-deep hover:text-plum disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent aria-pressed:text-plum"
    >
      {children}
    </button>
  );
}

export default function StoryPlayer({
  playing,
  muted,
  captions,
  onTogglePlay,
  onReplay,
  onToggleMute,
  onToggleCaptions,
  onExit,
  onPrev,
  onNext,
  onSeek,
  elapsed,
  duration,
  canPrev,
}: {
  playing: boolean;
  muted: boolean;
  captions: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  onToggleCaptions: () => void;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  elapsed: number;
  duration: number;
  canPrev: boolean;
}) {

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-white px-2 py-1.5 shadow-sm">
      <IconButton label={playing ? "Pause" : "Play"} onClick={onTogglePlay}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </IconButton>
      <IconButton label="Replay this scene" onClick={onReplay}>
        <RotateCcw size={16} />
      </IconButton>
      <IconButton
        label="Previous scene"
        onClick={onPrev}
        disabled={!canPrev}
      >
        <SkipBack size={18} />
      </IconButton>
      <IconButton label="Next scene" onClick={onNext}>
        <SkipForward size={18} />
      </IconButton>

      <div className="mx-1 flex min-w-24 flex-1 items-center gap-2">
        <span className="text-[11px] tabular-nums text-ink-soft">{fmt(elapsed)}</span>
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 0}
          step={0.1}
          value={Math.min(elapsed, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Seek within this scene"
          aria-valuetext={`${fmt(elapsed)} of ${fmt(duration)}`}
          disabled={duration <= 0}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink/10 accent-teal disabled:cursor-not-allowed"
          style={{ accentColor: "var(--color-teal)" }}
        />
        <span className="text-[11px] tabular-nums text-ink-soft">{fmt(duration)}</span>
      </div>

      <IconButton label={captions ? "Hide captions" : "Show captions"} onClick={onToggleCaptions} pressed={captions}>
        <Captions size={17} />
      </IconButton>
      <IconButton label={muted ? "Unmute" : "Mute"} onClick={onToggleMute} pressed={muted}>
        {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </IconButton>
      <IconButton label="Exit the story" onClick={onExit}>
        <X size={17} />
      </IconButton>
    </div>
  );
}
