import { useCallback, useEffect, useState } from "react";

/**
 * One HTMLAudioElement per mounted story screen, bound through the returned
 * callback ref (the screen renders <audio ref={audio.el}>). The element is
 * tracked in state, so if the node is ever swapped React re-runs the bind
 * effect and the new element gets the src and listeners the old one had.
 * `src` changes pause and swap the track; the hook never calls play() — the
 * container drives playback (the Begin gate's gesture starts it).
 * `error` is driven only by the media element's own error event — a rejected
 * play() is the autoplay policy, so it must not be mistaken for a broken
 * file. `retry` bumps a nonce so the same URL is re-requested.
 */
export function useStoryAudio(src: string) {
  const [element, setElement] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0); // bump to re-fetch the same file

  // Callback ref so the hook learns of the node (and any replacement of it)
  // as a state change, not a silent ref write.
  const el = useCallback((node: HTMLAudioElement | null) => setElement(node), []);

  useEffect(() => {
    if (!element) return;

    const onTime = () => setElapsed(element.currentTime);
    const onDur = () => setDuration(Number.isFinite(element.duration) ? element.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onErr = () => setError(true);
    const onLoaded = () => setError(false);

    element.addEventListener("timeupdate", onTime);
    element.addEventListener("durationchange", onDur);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("error", onErr);
    element.addEventListener("loadeddata", onLoaded);

    element.preload = "auto";
    element.src = `${src}?v=${nonce}`;

    setElapsed(0);
    setDuration(0);
    setPlaying(false);
    setError(false);

    // Unmount / rebind must stop sound: a detached element keeps playing
    // otherwise. The node itself is owned by React's ref, so it is left in
    // place (removeAttribute rather than src = "", which would re-resolve to
    // the document URL in real browsers).
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("durationchange", onDur);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("error", onErr);
      element.removeEventListener("loadeddata", onLoaded);
    };
  }, [element, src, nonce]);

  const play = useCallback(async () => {
    if (!element) return;
    // Optimistic: jsdom's stubbed play() fires no "play" event, so state
    // would otherwise never flip. A rejection (autoplay policy — the Begin
    // gate's gesture normally prevents it, and it is not a load failure)
    // rolls the flag back so the button cannot claim a stalled track.
    setPlaying(true);
    try {
      const p = element.play();
      // jsdom's play() returns undefined rather than a promise; only await
      // genuinely thenable results so tests never hang.
      if (p && typeof p.then === "function") await p;
    } catch {
      setPlaying(false);
    }
  }, [element]);

  const pause = useCallback(() => {
    if (!element) return;
    element.pause();
    setPlaying(false);
  }, [element]);

  const replay = useCallback(() => {
    if (!element) return;
    element.currentTime = 0;
    void play();
  }, [element, play]);

  const toggleMute = useCallback(() => {
    if (!element) return;
    element.muted = !element.muted;
    setMuted(element.muted);
  }, [element]);

  /** Scrub within the current scene's audio. Setting currentTime also fires a
   *  timeupdate in real browsers, but we set state directly so the slider
   *  tracks the drag even where that event is throttled. */
  const seek = useCallback(
    (seconds: number) => {
      if (!element) return;
      const max = Number.isFinite(element.duration) ? element.duration : seconds;
      const clamped = Math.min(Math.max(seconds, 0), max);
      element.currentTime = clamped;
      setElapsed(clamped);
    },
    [element],
  );

  // Re-registers whenever the element identity changes, so an <audio> swap
  // cannot silently drop the ended listener.
  const onEnded = useCallback(
    (cb: () => void) => {
      if (!element) return () => {};
      const handler = () => cb();
      element.addEventListener("ended", handler);
      return () => element.removeEventListener("ended", handler);
    },
    [element],
  );

  const retry = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  /* `nonce` is the retry counter: it changes when a retry rebinds the element
     and swaps the src, so containers can re-trigger playback after a failed
     load. */
  return {
    el,
    playing,
    muted,
    elapsed,
    duration,
    error,
    nonce,
    play,
    pause,
    replay,
    seek,
    toggleMute,
    onEnded,
    retry,
  };
}
