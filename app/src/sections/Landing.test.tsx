import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, type TraineeState } from "../api";
import { SessionProvider } from "../session";
import Landing from "./Landing";

const mockNavigate = vi.hoisted(() => vi.fn());

// Landing drives navigation through useNavigate — mock it and assert calls.
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the api module the same way session.test.tsx does.
vi.mock("../api", () => ({
  api: {
    config: vi.fn(),
    state: vi.fn(),
    entry: vi.fn(),
    response: vi.fn(),
    progress: vi.fn(),
    quiz: vi.fn(),
  },
}));

const CONFIG = {
  session: {
    title: "Sustained Inquiry: Pre-Session Prep",
    date: "Friday 14 November 2026",
    time: "2:00pm – 4:30pm",
    venue: "Room 312, CLT",
    deadline: "Friday 14 November 2026",
  },
  video: { enabled: false },
  seed_enabled: true,
};

function makeState(overrides: Partial<TraineeState> = {}): TraineeState {
  return {
    user: { name: "Alex Chan", email: "alex@example.com", subject_area: "Engineering" },
    progress: {},
    responses: {},
    quiz: {},
    ...overrides,
  };
}

function renderLanding() {
  return render(
    <SessionProvider>
      <Landing />
    </SessionProvider>,
  );
}

async function fillAndSubmit(name: string, email: string, subject = "") {
  await userEvent.type(screen.getByLabelText(/name/i), name);
  await userEvent.type(screen.getByLabelText(/email/i), email);
  if (subject) await userEvent.type(screen.getByLabelText(/subject area/i), subject);
  await userEvent.click(screen.getByRole("button", { name: /start/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockNavigate.mockClear();
  vi.mocked(api.config).mockResolvedValue(CONFIG);
  vi.mocked(api.state).mockRejectedValue(new Error("no session"));
  vi.mocked(api.response).mockResolvedValue({ ok: true });
  vi.mocked(api.progress).mockResolvedValue({ ok: true });
  vi.mocked(api.quiz).mockResolvedValue({ ok: true });
});

describe("Landing", () => {
  // vitest runs without globals, so RTL's auto-cleanup never registers
  afterEach(cleanup);

  it("renders the verbatim title, deadline subtitle and intro", async () => {
    renderLanding();
    expect(
      await screen.findByRole("heading", { name: "Sustained Inquiry: Pre-Session Prep" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Complete this before Friday 14 November 2026/)).toBeInTheDocument();
    expect(screen.getByText(/spend our live time practicing, not lecturing/)).toBeInTheDocument();
  });

  it("blocks submit with inline errors when name and email are empty", async () => {
    renderLanding();
    const start = await screen.findByRole("button", { name: /start/i });
    await userEvent.click(start);
    expect(vi.mocked(api.entry)).not.toHaveBeenCalled();
    expect(await screen.findByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your email.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("blocks submit when the email format is invalid", async () => {
    renderLanding();
    await screen.findByRole("button", { name: /start/i });
    await fillAndSubmit("Alex Chan", "not-an-email");
    expect(vi.mocked(api.entry)).not.toHaveBeenCalled();
    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
  });

  it("calls enter and navigates to the first incomplete section on a valid submit", async () => {
    const entry = vi.mocked(api.entry);
    entry.mockResolvedValue(makeState());
    renderLanding();
    await screen.findByRole("heading", { name: /sustained inquiry/i });
    await fillAndSubmit("Ada Lovelace", "ada@example.com", "Design");
    await waitFor(() =>
      expect(entry).toHaveBeenCalledWith("Ada Lovelace", "ada@example.com", "Design"),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/section/1"));
  });

  it("resumes at the first incomplete section when a known email re-enters", async () => {
    vi.mocked(api.entry).mockResolvedValue(
      makeState({ progress: { "1": { started: true, completed: true } } }),
    );
    renderLanding();
    await screen.findByRole("heading", { name: /sustained inquiry/i });
    await fillAndSubmit("Alex Chan", "alex@example.com");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/section/2"));
  });

  it("shows an inline error and stays put when the entry API fails", async () => {
    vi.mocked(api.entry).mockRejectedValue(new Error("network down"));
    renderLanding();
    await screen.findByRole("heading", { name: /sustained inquiry/i });
    await fillAndSubmit("Ada Lovelace", "ada@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't reach the server/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("greets a returning user with a progress bar and a working Continue button", async () => {
    localStorage.setItem("pbl:email", "alex@example.com");
    vi.mocked(api.state).mockResolvedValue(
      makeState({ progress: { "1": { started: true, completed: true } } }),
    );
    renderLanding();
    expect(await screen.findByText("Welcome back, Alex")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/section/2");
  });

  it("navigates to /done once every required section is complete", async () => {
    localStorage.setItem("pbl:email", "alex@example.com");
    vi.mocked(api.state).mockResolvedValue(
      makeState({
        progress: {
          "1": { started: true, completed: true },
          "2": { started: true, completed: true },
          "4": { started: true, completed: true },
          "6": { started: true, completed: true },
        },
      }),
    );
    renderLanding();
    const cont = await screen.findByRole("button", { name: /continue/i });
    await userEvent.click(cont);
    expect(mockNavigate).toHaveBeenCalledWith("/done");
  });

  it("offers Not you? to switch accounts, returning to the entry form", async () => {
    localStorage.setItem("pbl:email", "alex@example.com");
    vi.mocked(api.state).mockResolvedValue(makeState());
    renderLanding();
    await screen.findByText("Welcome back, Alex");
    await userEvent.click(screen.getByRole("button", { name: /not you\?/i }));
    expect(await screen.findByLabelText(/name/i)).toBeInTheDocument();
    expect(localStorage.getItem("pbl:email")).toBeNull();
  });
});
