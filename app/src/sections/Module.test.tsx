import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Module from "./Module";
import { S6 } from "../content";

// Mock the session store (like session.test.tsx mocks its api module); the
// real useAutosave stays in place since TextField depends on it.
const h = vi.hoisted(() => ({
  responses: {} as Record<string, Record<string, string>>,
  saveResponse: vi.fn(),
  markStarted: vi.fn(),
  markCompleted: vi.fn(),
}));

vi.mock("../session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../session")>();
  return {
    ...actual,
    useSession: () => ({
      ready: true,
      user: { name: "T", email: "t@x.com", subject_area: "" },
      progress: {},
      responses: h.responses,
      quiz: {},
      config: null,
      completedCount: 3,
      isComplete: () => false,
      enter: vi.fn(),
      saveResponse: h.saveResponse,
      markStarted: h.markStarted,
      markCompleted: h.markCompleted,
      recordQuiz: vi.fn(),
      applyState: vi.fn(),
      forget: vi.fn(),
    }),
  };
});

function renderModule() {
  return render(
    <MemoryRouter>
      <Module />
    </MemoryRouter>,
  );
}

/** Fields are addressed by their accessible label, never by index: if the
    label ↔ control association breaks (no htmlFor/id), the query throws and
    the missing accessible name fails loudly instead of hiding behind order. */
function field(index: number) {
  return screen.getByRole("textbox", { name: S6.fields[index].label });
}

const TOPIC = "Principles of Marketing";
const PROBLEM = "A local cafe keeps losing regular customers to a new chain.";
const ENTRY = "Invite the cafe owner to speak about their falling sales.";

beforeEach(() => {
  h.responses = {};
  h.saveResponse.mockReset();
  h.saveResponse.mockResolvedValue(undefined);
  h.markStarted.mockReset();
  h.markCompleted.mockReset();
});

// vitest runs without globals, so testing-library cleanup is manual here.
afterEach(() => cleanup());

describe("S6 Module reflection", () => {
  it("renders the verbatim framing, the live-session hint, and all four fields", () => {
    renderModule();
    expect(screen.getByText(S6.framing)).toBeInTheDocument();
    expect(screen.getByText(/feed straight into the live session/i)).toBeInTheDocument();
    // every input is reachable through its visible label (WCAG 1.3.1/3.3.2)
    S6.fields.forEach((f) => {
      expect(screen.getByRole("textbox", { name: f.label })).toBeInTheDocument();
    });
  });

  it("keeps Continue disabled until every required field has content", async () => {
    const user = userEvent.setup();
    renderModule();
    const cont = screen.getByRole("button", { name: /continue/i });
    expect(cont).toBeDisabled();

    await user.type(field(0), TOPIC);
    expect(cont).toBeDisabled();

    await user.type(field(1), PROBLEM);
    expect(cont).toBeDisabled();

    await user.type(field(2), ENTRY);
    expect(cont).toBeEnabled();
  });

  it("marks section 6 complete when Continue is clicked", async () => {
    const user = userEvent.setup();
    renderModule();
    await user.type(field(0), TOPIC);
    await user.type(field(1), PROBLEM);
    await user.type(field(2), ENTRY);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(h.markCompleted).toHaveBeenCalledWith(6);
  });

  it("the optional field neither unlocks nor blocks Continue", async () => {
    const user = userEvent.setup();
    renderModule();
    const cont = screen.getByRole("button", { name: /continue/i });

    await user.type(field(3), "Why do regulars drift away?");
    expect(cont).toBeDisabled();

    await user.type(field(0), TOPIC);
    await user.type(field(1), PROBLEM);
    await user.type(field(2), ENTRY);
    expect(cont).toBeEnabled();
  });

  it("autosaves a typed value through saveResponse(6, fieldName, value)", async () => {
    const user = userEvent.setup();
    renderModule();
    await user.type(field(1), PROBLEM);
    await user.tab(); // blur flushes the autosave immediately
    await waitFor(() =>
      expect(h.saveResponse).toHaveBeenCalledWith(6, "module_problem", PROBLEM),
    );
  });

  it("initialises fields from saved responses so returning trainees resume", () => {
    h.responses = {
      "6": { module_topic: "CAD/CAM Systems", module_problem: "Workshop scraps pile up." },
    };
    renderModule();
    expect(field(0)).toHaveValue("CAD/CAM Systems");
    expect(field(1)).toHaveValue("Workshop scraps pile up.");
    // partially answered resume still requires the remaining required field
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
