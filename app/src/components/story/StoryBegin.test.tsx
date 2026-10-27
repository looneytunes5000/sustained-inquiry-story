import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoryBegin from "./StoryBegin";

afterEach(cleanup);

const noop = () => {};

describe("StoryBegin", () => {
  it("autoplays the opening clip on a loop", () => {
    render(<StoryBegin resumeFrom={null} onBegin={noop} onRestart={noop} />);
    const video = screen.getByLabelText(/story opening/i) as HTMLVideoElement;
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
  });

  it("tries audible playback and falls back to muted when refused", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new Error("NotAllowedError"))
      .mockResolvedValue(undefined);

    render(<StoryBegin resumeFrom={null} onBegin={noop} onRestart={noop} />);
    const video = screen.getByLabelText(/story opening/i) as HTMLVideoElement;

    // First attempt is unmuted; after the refusal the element is muted and
    // played again so the loop still runs.
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(video.muted).toBe(true);
    play.mockRestore();
  });

  it("keeps native controls so the viewer can turn sound on", () => {
    render(<StoryBegin resumeFrom={null} onBegin={noop} onRestart={noop} />);
    expect(screen.getByLabelText(/story opening/i)).toHaveAttribute("controls");
  });

  it("offers a plain Begin when there is no saved progress", () => {
    render(<StoryBegin resumeFrom={null} onBegin={noop} onRestart={noop} />);
    expect(screen.getByRole("button", { name: /begin/i })).toBeInTheDocument();
    expect(screen.queryByText(/start from the beginning/i)).not.toBeInTheDocument();
  });

  it("offers resume and restart when progress exists", () => {
    render(<StoryBegin resumeFrom={7} onBegin={noop} onRestart={noop} />);
    expect(screen.getByRole("button", { name: /continue from scene 7/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start from the beginning/i })).toBeInTheDocument();
  });
});
