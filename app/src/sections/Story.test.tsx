import { cleanup, render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Story, { useAppStoryShell } from "./Story";

const mocks = vi.hoisted(() => ({
  ready: true,
  user: { name: "Alex Chan", email: "alex@school.edu.hk", subject_area: "Engineering" },
  responses: {} as Record<string, Record<string, string>>,
  saveResponse: vi.fn(),
}));

vi.mock("../session", () => ({
  useSession: () => ({
    ready: mocks.ready,
    user: mocks.user,
    responses: mocks.responses,
    saveResponse: mocks.saveResponse,
  }),
}));

/** Mirrors App's StoryRoute: binds the screen to the (mocked) session. */
function StoryRoute() {
  return <Story shell={useAppStoryShell()} />;
}

function renderStory() {
  return render(
    <MemoryRouter initialEntries={["/story"]}>
      <Routes>
        <Route path="/story" element={<StoryRoute />} />
        <Route path="/" element={<h1>Landing</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** jsdom has no media stack: drive the container's <audio> handlers by hand. */
function advanceAudioToEnd() {
  const audio = document.querySelector("audio");
  // Wrapped in act: the container's state updates run inside React here.
  act(() => {
    audio?.dispatchEvent(new Event("ended"));
  });
}

describe("Story route", () => {
  // jsdom has no media stack: stub play/pause so nothing hangs or logs
  // "Not implemented" noise from the real (missing) media backend. Defined
  // before the cleanup hook because vitest runs afterEach hooks in reverse —
  // cleanup must unmount while the stub is still in place.
  let playSpy: ReturnType<typeof vi.spyOn>;
  let pauseSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.clearAllMocks();
    playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    mocks.user = { name: "Alex Chan", email: "alex@school.edu.hk", subject_area: "Engineering" };
    mocks.ready = true;
    mocks.responses = {};
    // reach() does saveResponse(...).catch(() => {}), so the mock must return
    // a promise, not undefined, or the .catch throws a TypeError.
    mocks.saveResponse.mockResolvedValue(undefined);
  });
  afterEach(() => {
    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  // vitest runs without globals, so RTL's auto-cleanup never registers
  afterEach(cleanup);

  it("sends an unauthenticated trainee back to the landing page", () => {
    mocks.user = null as never;
    renderStory();
    expect(screen.getByRole("heading", { name: "Landing" })).toBeInTheDocument();
  });

  it("does not render the story while the session is still loading", () => {
    mocks.ready = false;
    renderStory();
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("shows the Begin gate first and starts at scene 1 after Begin", async () => {
    const user = userEvent.setup();
    renderStory();

    const begin = screen.getByRole("button", { name: /begin/i });
    await user.click(begin);

    expect(screen.getByRole("img", { name: "The Big Question" })).toBeInTheDocument();
    expect(screen.getByText("Nothing on the wall yet.")).toBeInTheDocument();
  });

  it("offers Continue from the saved scene and Start from the beginning", () => {
    mocks.responses = { "0": { story_furthest: "4" } };
    renderStory();
    expect(screen.getByRole("button", { name: /continue from scene 4/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start from the beginning/i })).toBeInTheDocument();
  });

  it("advances to the next scene when the narration ends", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    advanceAudioToEnd();
    expect(await screen.findByRole("img", { name: "Rules for Asking" })).toBeInTheDocument();
  });

  it("persists the furthest scene reached through saveResponse", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));
    advanceAudioToEnd();

    expect(mocks.saveResponse).toHaveBeenCalledWith(0, "story_furthest", "2");
  });

  it("blocks a locked stage and explains why", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    await user.click(screen.getByRole("button", { name: /gather/i }));
    expect(screen.getByText(/watch to here first/i)).toBeInTheDocument();
    expect(screen.getByText(/gather unlocks/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "The Big Question" })).toBeInTheDocument();
  });

  it("jumps to a stage's opening scene when its node is clicked", async () => {
    mocks.responses = { "0": { story_furthest: "5" } };
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /start from the beginning/i }));

    // QFT now opens at scene 2.
    await user.click(screen.getByRole("button", { name: /^QFT/i }));
    expect(
      await screen.findByRole("img", { name: "Rules for Asking" }),
    ).toBeInTheDocument();
  });

  it("shows the failure block when the audio fires an error", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    const audio = document.querySelector("audio") as HTMLAudioElement;
    act(() => {
      audio.dispatchEvent(new Event("error"));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("retries the same file through the hook rather than reloading", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    const audio = document.querySelector("audio") as HTMLAudioElement;
    act(() => {
      audio.dispatchEvent(new Event("error"));
    });

    await user.click(screen.getByRole("button", { name: /retry/i }));

    // The retry path is the hook's nonce bump (same URL, v=1), not a page reload.
    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "/story/scene-01.mp3?v=1",
    );
  });

  it("resumes playback after a successful retry", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    const before = playSpy.mock.calls.length;
    const audio = document.querySelector("audio") as HTMLAudioElement;
    act(() => {
      audio.dispatchEvent(new Event("error"));
    });

    await user.click(screen.getByRole("button", { name: /retry/i }));

    // The retry bump re-runs the play effect, so playback is attempted again
    // instead of leaving a silent paused scene behind the cleared error card.
    expect(playSpy.mock.calls.length).toBeGreaterThan(before);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("moves forward and back with the arrow keys without scrolling", async () => {
    // furthest 2 makes scene 2 unlocked; "Start from the beginning" puts the
    // viewer on scene 1, so ArrowRight may legally advance to it.
    mocks.responses = { "0": { story_furthest: "2" } };
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /start from the beginning/i }));

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByRole("img", { name: "Rules for Asking" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(await screen.findByRole("img", { name: "The Big Question" })).toBeInTheDocument();
  });

  it("toggles pause and play with the space bar", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    const before = playSpy.mock.calls.length;
    fireEvent.keyDown(window, { key: " " });
    expect(pauseSpy).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: " " });
    expect(playSpy.mock.calls.length).toBeGreaterThan(before);
  });

  it("ignores the caption and mute shortcuts while a modifier is held", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    fireEvent.keyDown(window, { key: "c", ctrlKey: true });
    fireEvent.keyDown(window, { key: "m", metaKey: true });
    fireEvent.keyDown(window, { key: "c", altKey: true });

    expect(screen.queryByText(/captions/i)).not.toBeInTheDocument();
  });

  it("exits to the landing page on Escape", async () => {
    const user = userEvent.setup();
    renderStory();
    await user.click(screen.getByRole("button", { name: /begin/i }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "Landing" })).toBeInTheDocument();
  });

  it("shows the end card once the final scene finishes", async () => {
    mocks.responses = { "0": { story_furthest: "15" } };
    const user = userEvent.setup();
    renderStory();

    await user.click(screen.getByRole("button", { name: /continue from scene 15/i }));
    advanceAudioToEnd();

    expect(screen.getByRole("region", { name: /story end/i })).toBeInTheDocument();
  });

  it("keeps the furthest scene monotonic and swallows a failed save", async () => {
    // Once-only: earlier beforeEach sets a resolving default, and a sticky
    // rejection would otherwise leak into any later test's save path.
    mocks.saveResponse.mockRejectedValueOnce(new Error("offline"));
    mocks.responses = { "0": { story_furthest: "4" } };
    const user = userEvent.setup();
    renderStory();

    // Continue from the saved scene 4: ending it only ever saves 5, never lower.
    await user.click(screen.getByRole("button", { name: /continue from scene 4/i }));
    advanceAudioToEnd();
    expect(mocks.saveResponse).toHaveBeenCalledWith(0, "story_furthest", "5");

    // Going back to scene 2 must not demote the saved furthest.
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    advanceAudioToEnd();
    expect(mocks.saveResponse).not.toHaveBeenCalledWith(0, "story_furthest", "3");
  });
});
