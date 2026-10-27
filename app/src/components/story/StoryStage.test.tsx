import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoryStage from "./StoryStage";
import { STORY_SCENES } from "../../data/story-manifest";

const scene = STORY_SCENES[2];

describe("StoryStage", () => {
  // vitest runs without globals, so RTL's auto-cleanup never registers
  afterEach(cleanup);

  it("renders the panel image with a meaningful alt", () => {
    render(
      <StoryStage scene={scene} captions={true} showError={false} onRetry={vi.fn()} onLeave={vi.fn()} />,
    );
    expect(screen.getByRole("img", { name: scene.title })).toHaveAttribute("src", scene.image);
  });

  it("hides the caption strip when captions are off", () => {
    render(
      <StoryStage scene={scene} captions={false} showError={false} onRetry={vi.fn()} onLeave={vi.fn()} />,
    );
    expect(screen.queryByTestId("caption-strip")).not.toBeInTheDocument();
  });

  it("shows the caption strip when captions are on", () => {
    render(
      <StoryStage scene={scene} captions={true} showError={false} onRetry={vi.fn()} onLeave={vi.fn()} />,
    );
    expect(screen.getByTestId("caption-strip")).toBeInTheDocument();
  });

  it("renders the failure block with Retry and Leave, and no advancing on its own", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onLeave = vi.fn();
    render(
      <StoryStage scene={scene} captions={false} showError={true} onRetry={onRetry} onLeave={onLeave} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/narration didn't load/i);
    expect(screen.getByRole("img", { name: scene.title })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /leave the story/i }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("does not show the failure block on a healthy scene", () => {
    render(
      <StoryStage scene={scene} captions={false} showError={false} onRetry={vi.fn()} onLeave={vi.fn()} />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
