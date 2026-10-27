import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROVOCATION, S1 } from "../content";
import Video from "./Video";

/* Mock useSession (Video + SectionShell both consume it) while keeping the
   real useAutosave export, so the 10 s debounce behaves exactly as in the
   app. Same vi.mock approach session.test.tsx uses for ./api. */
const sessionMocks = vi.hoisted(() => ({
  saveResponse: vi.fn<(sectionId: number, field: string, value: string) => Promise<void>>(),
  markCompleted: vi.fn<(id: number) => void>(),
  markStarted: vi.fn<(id: number) => void>(),
  isComplete: vi.fn<() => boolean>(() => false),
  responses: {} as Record<string, Record<string, string>>,
  config: { video: { enabled: false } } as {
    video: { enabled: boolean; url?: string; captions_url?: string };
  },
}));

vi.mock("../session", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("../session");
  return {
    ...actual,
    useSession: () => ({
      ready: true,
      user: { name: "T", email: "t@x.com", subject_area: "" },
      progress: {},
      responses: sessionMocks.responses,
      quiz: {},
      config: sessionMocks.config,
      completedCount: 0,
      isComplete: sessionMocks.isComplete,
      enter: vi.fn<(name: string, email: string, subject: string) => Promise<void>>(),
      saveResponse: sessionMocks.saveResponse,
      markStarted: sessionMocks.markStarted,
      markCompleted: sessionMocks.markCompleted,
      recordQuiz: vi.fn<(qid: number, selected: string, isCorrect: boolean) => void>(),
      applyState: vi.fn(),
      forget: vi.fn(),
    }),
  };
});

function renderVideo() {
  return render(
    <MemoryRouter initialEntries={["/section/1"]}>
      <Video />
    </MemoryRouter>,
  );
}

describe("S1 Provocation (Video)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionMocks.saveResponse.mockResolvedValue(undefined);
    sessionMocks.isComplete.mockReturnValue(false);
    sessionMocks.responses = {};
    sessionMocks.config = { video: { enabled: false } };
  });
  // vitest runs without globals, so RTL's auto-cleanup never registers
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders the two written scenarios (Appendix A) and the verbatim prompt, Continue disabled while empty", () => {
    const { container } = renderVideo();
    // both scenarios ship as the provocation while the client's video is absent
    for (const s of PROVOCATION.scenarios) {
      expect(screen.getByRole("heading", { name: s.title })).toBeInTheDocument();
      expect(screen.getByText(s.body)).toBeInTheDocument();
    }
    expect(screen.getByText(PROVOCATION.framing)).toBeInTheDocument();
    expect(screen.getByText(S1.reflectionPrompt)).toBeInTheDocument();
    expect(sessionMocks.markStarted).toHaveBeenCalledWith(1);
    // no player until config.video flips on
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("renders a real <video> with captions once config.video.enabled is true", () => {
    sessionMocks.config = {
      video: { enabled: true, url: "/media/provocation.mp4", captions_url: "/media/provocation.vtt" },
    };
    const { container } = renderVideo();
    const el = container.querySelector("video");
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute("src", "/media/provocation.mp4");
    expect(el).toHaveAttribute("controls");
    const track = container.querySelector('track[kind="captions"]');
    expect(track).not.toBeNull();
    expect(track).toHaveAttribute("src", "/media/provocation.vtt");
    // the written scenarios are replaced, not shown alongside the player
    expect(screen.queryByText(PROVOCATION.scenarios[0].body)).not.toBeInTheDocument();
  });

  it("associates the prompt label with the reflection field (accessible name + htmlFor)", () => {
    const { container } = renderVideo();
    // accessible name resolves through the label (WCAG 1.3.1 / 4.1.2)…
    const box = screen.getByRole("textbox", { name: S1.reflectionPrompt });
    // …and the label's for attribute points at the control's id, so clicking
    // the label focuses the field in a real browser (jsdom skips that step).
    const label = container.querySelector("label[for]");
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute("for", box.id);
    expect(box.id).not.toBe("");
  });

  it("autosaves the reflection 10 s after typing", async () => {
    renderVideo();
    const answer = "In B the students' questions drove the work.";
    fireEvent.change(screen.getByRole("textbox"), { target: { value: answer } });
    expect(sessionMocks.saveResponse).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(sessionMocks.saveResponse).toHaveBeenCalledWith(1, S1.reflectionField, answer);
  });

  it("Continue saves the answer immediately and marks section 1 complete", () => {
    renderVideo();
    const answer = "A tells, B asks.";
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: answer } });
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeEnabled();
    // leaving the field flushes the autosave straight away
    fireEvent.blur(box);
    expect(sessionMocks.saveResponse).toHaveBeenCalledWith(1, S1.reflectionField, answer);
    fireEvent.click(continueBtn);
    expect(sessionMocks.saveResponse).toHaveBeenCalledWith(1, S1.reflectionField, answer);
    expect(sessionMocks.markCompleted).toHaveBeenCalledWith(1);
  });

  it("restores a saved reflection so a returning trainee can resume", () => {
    sessionMocks.responses = {
      "1": { [S1.reflectionField]: "Scenario B builds curiosity first." },
    };
    renderVideo();
    expect(screen.getByRole("textbox")).toHaveValue("Scenario B builds curiosity first.");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });
});
