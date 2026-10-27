import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { SessionProvider } from "../session";
import Admin from "./Admin";

vi.mock("../api", () => ({
  api: {
    config: vi.fn(),
    state: vi.fn(),
    entry: vi.fn(),
    response: vi.fn(),
    progress: vi.fn(),
    quiz: vi.fn(),
    admin: {
      overview: vi.fn(),
      responses: vi.fn(),
      seed: vi.fn(),
      exportUrl: (p: string) => `/api/admin/export.csv?p=${p}`,
    },
  },
}));

const PASSWORD = "trainer-pw";

const oneUser = {
  ok: true as const,
  users: [
    {
      name: "Alex Chan",
      email: "alex.chan@example.com",
      subject_area: "Engineering",
      completed_count: 4,
      last_active_at: "2026-09-17 10:00:00",
    },
  ],
  quiz: [
    { question_id: 1, total: 1, correct: 1, pct: 100 },
    { question_id: 2, total: 1, correct: 1, pct: 100 },
    { question_id: 3, total: 1, correct: 0, pct: 0 },
  ],
};

const twoUsers = {
  ok: true as const,
  users: [
    ...oneUser.users,
    {
      name: "Ivy Tam",
      email: "ivy.tam@example.com",
      subject_area: "Business",
      completed_count: 2,
      last_active_at: "2026-09-16 09:30:00",
    },
  ],
  quiz: oneUser.quiz,
};

type User = ReturnType<typeof userEvent.setup>;

function renderAdmin() {
  return render(
    <SessionProvider>
      <Admin />
    </SessionProvider>,
  );
}

async function signIn(user: User, password: string) {
  await user.type(screen.getByLabelText("Admin password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  sessionStorage.clear();
  vi.resetAllMocks();
  // SessionProvider boots even without a signed-in trainee; config drives the seed toggle.
  vi.mocked(api.config).mockResolvedValue({
    session: { title: "t", date: "d", time: "t", venue: "v", deadline: "d" },
    video: { enabled: false },
    seed_enabled: true,
  });
  vi.mocked(api.state).mockRejectedValue(new Error("no session"));
});

// vitest runs without globals, so RTL's auto-cleanup never registers
afterEach(() => {
  cleanup();
});

describe("Admin", () => {
  it("shows an inline error for a wrong password", async () => {
    vi.mocked(api.admin.overview).mockRejectedValue(new Error("Unauthorized"));
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user, "nope");
    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
    expect(api.admin.overview).toHaveBeenCalledWith("nope");
    expect(sessionStorage.getItem("pbl:admin")).toBeNull();
  });

  it("renders the overview after a correct password", async () => {
    vi.mocked(api.admin.overview).mockResolvedValue(oneUser);
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user, PASSWORD);
    expect(await screen.findByText("Alex Chan")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Enrolled")).toBeInTheDocument();
    expect(screen.getByText("100% of enrolled finished all 4 sections")).toBeInTheDocument();
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Q3: 0% first-attempt correct" }),
    ).toBeInTheDocument();
  });

  it("seeds demo data and refetches the overview", async () => {
    vi.mocked(api.admin.overview)
      .mockResolvedValueOnce(oneUser) // password check
      .mockResolvedValueOnce(oneUser) // initial dashboard load
      .mockResolvedValue(twoUsers); // refetch after seeding
    vi.mocked(api.admin.seed).mockResolvedValue({ ok: true, inserted: 12 });
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user, PASSWORD);
    await user.click(await screen.findByRole("button", { name: /load demo data/i }));
    expect(await screen.findByText("Seeded 12 demo trainees.")).toBeInTheDocument();
    expect(api.admin.seed).toHaveBeenCalledWith(PASSWORD);
    expect(await screen.findByText("Ivy Tam")).toBeInTheDocument();
  });

  it("lists responses, exports CSV, and filters by search text", async () => {
    vi.mocked(api.admin.overview).mockResolvedValue(oneUser);
    vi.mocked(api.admin.responses).mockResolvedValue({
      ok: true,
      rows: [
        {
          name: "Alex Chan",
          email: "alex.chan@example.com",
          subject_area: "Engineering",
          section_id: 6,
          field_name: "module_topic",
          value: "CAD/CAM Systems",
          updated_at: "2026-09-17 10:00:00",
        },
        {
          name: "Ivy Tam",
          email: "ivy.tam@example.com",
          subject_area: "Business",
          section_id: 1,
          field_name: "reflection_video",
          value: "Scenario B repeats the cycle.",
          updated_at: "2026-09-16 09:30:00",
        },
      ],
    });
    const user = userEvent.setup();
    renderAdmin();
    await signIn(user, PASSWORD);
    await user.click(await screen.findByRole("tab", { name: "Responses" }));
    expect(await screen.findByText("CAD/CAM Systems")).toBeInTheDocument();
    expect(screen.getByText("reflection_video")).toBeInTheDocument();
    expect(screen.getByText("Export CSV")).toHaveAttribute(
      "download",
      "pbl-prep-responses.csv",
    );
    await user.type(screen.getByLabelText("Search"), "cad");
    expect(screen.queryByText("reflection_video")).not.toBeInTheDocument();
    expect(screen.getByText("CAD/CAM Systems")).toBeInTheDocument();
  });
});
