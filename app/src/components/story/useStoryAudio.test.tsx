import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStoryAudio } from "./useStoryAudio";

/**
 * Harness for the callback-ref hook. The screen (Task 8) renders a real
 * <audio ref={audio.el}>; here we do the same — the callback ref is attached
 * to a real <audio> node React commits to the document — and mirror the
 * hook's state into data attributes so tests can assert on it. The play
 * button drives the hook's play(), which is what must swallow a rejection.
 */
function Harness({ src }: { src: string }) {
  const audio = useStoryAudio(src);
  return (
    <div>
      <audio ref={audio.el} data-testid="audio" />
      <button type="button" onClick={() => void audio.play()}>
        play
      </button>
      <span data-testid="state" data-error={String(audio.error)} data-playing={String(audio.playing)} />
    </div>
  );
}

describe("useStoryAudio", () => {
  // vitest runs without globals, so RTL's auto-cleanup never registers
  afterEach(cleanup);
  // jsdom has no media stack and logs "Not implemented" whenever the real
  // pause runs (the hook pauses on unmount). Stub it for every test; the
  // unmount test re-spys to assert call counts.
  let pauseSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });
  afterEach(() => pauseSpy.mockRestore());

  it("pauses and clears the src attribute on unmount", () => {
    const { unmount, getByTestId } = render(<Harness src="/story/scene-01.mp3" />);

    const audio = getByTestId("audio") as HTMLAudioElement;
    // The hook bound on mount and requested the track (with the nonce suffix).
    expect(audio.getAttribute("src")).toBe("/story/scene-01.mp3?v=0");
    expect(pauseSpy).not.toHaveBeenCalled();

    unmount();

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(audio.getAttribute("src")).toBeNull();
    pauseSpy.mockRestore();
  });

  it("sets error true when the element fires an error event", () => {
    // jsdom's media stack cannot produce a real load failure, so drive the
    // same path the browser uses: dispatch the element's error event.
    const { getByTestId } = render(<Harness src="/story/scene-01.mp3" />);
    const audio = getByTestId("audio") as HTMLAudioElement;
    const state = getByTestId("state");

    expect(state.getAttribute("data-error")).toBe("false");

    act(() => {
      audio.dispatchEvent(new Event("error"));
    });

    expect(state.getAttribute("data-error")).toBe("true");
  });

  it("keeps error false when play() rejects (autoplay policy, not a load failure)", async () => {
    // A rejected play() is the Begin gate's autoplay-policy path — it must
    // never raise the failure block, unlike the element's error event.
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValue(new DOMException("NotAllowedError", "NotAllowedError"));

    const { getByTestId } = render(<Harness src="/story/scene-01.mp3" />);
    const state = getByTestId("state");

    expect(state.getAttribute("data-error")).toBe("false");

    // Drive the hook's play() — the path a real user gesture takes.
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "play" }));

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(state.getAttribute("data-error")).toBe("false");
    playSpy.mockRestore();
  });
});
