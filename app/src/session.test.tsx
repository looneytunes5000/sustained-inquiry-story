import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SessionProvider, useSession, useAutosave } from "./session";
import { firstAttemptScore } from "./quiz";

vi.mock("./api", () => ({
  api: {
    config: vi.fn().mockResolvedValue({
      session: { title: "t", date: "d", time: "t", venue: "v", deadline: "d" },
      video: { enabled: false },
      seed_enabled: true,
    }),
    state: vi.fn().mockRejectedValue(new Error("no session")),
    entry: vi.fn().mockResolvedValue({
      user: { name: "T", email: "t@x.com", subject_area: "" },
      progress: {},
      responses: {},
      quiz: {},
    }),
    response: vi.fn().mockResolvedValue({ ok: true }),
    progress: vi.fn().mockResolvedValue({ ok: true }),
    quiz: vi.fn().mockResolvedValue({ ok: true }),
    admin: {
      overview: vi.fn(),
      responses: vi.fn(),
      seed: vi.fn(),
      exportUrl: (p: string) => `/api/admin/export.csv?p=${p}`,
    },
  },
}));

describe("recordQuiz — first-attempt semantics", () => {
  it("freezes first-attempt correctness across retries and stray clicks", async () => {
    const { result } = renderHook(() => useSession(), { wrapper: SessionProvider });
    await act(async () => {
      await result.current.enter("T", "t@x.com", "");
    });

    // First attempt wrong, retry correct → the question must NOT earn credit.
    act(() => result.current.recordQuiz(1, "A", false));
    act(() => result.current.recordQuiz(1, "B", true));
    expect(result.current.quiz["1"].is_correct).toBe(false);
    expect(result.current.quiz["1"].attempts).toBe(2);

    // First attempt right, then a stray extra click → credit must be kept.
    act(() => result.current.recordQuiz(2, "B", true));
    act(() => result.current.recordQuiz(2, "A", false));
    expect(result.current.quiz["2"].is_correct).toBe(true);
    expect(result.current.quiz["2"].attempts).toBe(2);

    expect(firstAttemptScore(result.current.quiz)).toBe(1);
  });
});

describe("useAutosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves after the debounce delay while dirty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ v }) => useAutosave(v, onSave), {
      initialProps: { v: "" },
    });
    rerender({ v: "hello" });
    expect(onSave).not.toHaveBeenCalled();
    await act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onSave).toHaveBeenCalledWith("hello");
  });

  it("flushes immediately on demand (blur)", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, onSave), {
      initialProps: { v: "" },
    });
    rerender({ v: "typed" });
    await act(async () => {
      await result.current.flush();
    });
    expect(onSave).toHaveBeenCalledWith("typed");
  });

  it("does not save when unchanged", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutosave("same", onSave));
    await act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
