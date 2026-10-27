import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cycle from "./Cycle";
import { CYCLE_EXAMPLES } from "../content";

const mocks = vi.hoisted(() => ({
  markStarted: vi.fn(),
  markCompleted: vi.fn(),
}));

vi.mock("../session", () => ({
  useSession: () => ({
    markStarted: mocks.markStarted,
    markCompleted: mocks.markCompleted,
    isComplete: () => false,
  }),
}));

function renderCycle() {
  return render(
    <MemoryRouter>
      <Cycle />
    </MemoryRouter>,
  );
}

/** Node buttons render twice (desktop ring + mobile list share state) — take the first. */
function nodeButton(title: string) {
  const matches = screen.getAllByRole("button", { name: new RegExp(title, "i") });
  expect(matches.length).toBeGreaterThan(0);
  return matches[0];
}

describe("Cycle (S2 — the inquiry cycle)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps Continue disabled at 4/5 visited and enables on the 5th", async () => {
    const user = userEvent.setup();
    renderCycle();

    expect(
      screen.getByRole("button", { name: /visit all 5 nodes/i }),
    ).toBeDisabled();

    for (const title of ["Entry Event", "Generate Questions", "Investigate", "Apply & Test"]) {
      await user.click(nodeButton(title));
    }
    expect(
      screen.getByRole("button", { name: /visit all 5 nodes \(4\/5\)/i }),
    ).toBeDisabled();

    await user.click(nodeButton("New Questions Emerge"));
    const continueBtn = screen.getByRole("button", { name: "Continue" });
    expect(continueBtn).toBeEnabled();

    await user.click(continueBtn);
    expect(mocks.markCompleted).toHaveBeenCalledWith(2);
  });

  it("shows the node definition and swaps the example when a discipline chip is selected", async () => {
    const user = userEvent.setup();
    renderCycle();

    await user.click(nodeButton("Entry Event"));

    expect(
      await screen.findByText(
        "A provocation (video, object, guest, field trip) that sparks curiosity about a real problem.",
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(CYCLE_EXAMPLES["entry-event"].engineering),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Business" }));
    expect(
      await screen.findByText(CYCLE_EXAMPLES["entry-event"].business),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(CYCLE_EXAMPLES["entry-event"].engineering),
    ).not.toBeInTheDocument();
  });
});
