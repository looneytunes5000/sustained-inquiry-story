import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoryEndCard from "./StoryEndCard";

afterEach(cleanup);

const noop = () => {};

function renderEnd() {
  return render(<StoryEndCard onReplay={noop} onExit={noop} />);
}

describe("StoryEndCard before/after board", () => {
  it("shows a Before board carrying exactly the five scene-2 questions", () => {
    renderEnd();
    const before = screen.getByRole("region", { name: /^before/i });
    for (const id of ["Q1", "Q2", "Q3", "Q4", "Q5"]) {
      expect(within(before).getByText(id)).toBeInTheDocument();
    }
    // Nothing settled, nothing prioritised, nothing from later scenes.
    expect(within(before).queryByText("Q6")).not.toBeInTheDocument();
    expect(within(before).queryByText(/prioritised/i)).not.toBeInTheDocument();
    expect(within(before).queryByText(/^answered$/i)).not.toBeInTheDocument();
  });

  it("shows an After board at the closing state, with annotations", () => {
    renderEnd();
    const after = screen.getByRole("region", { name: /^after/i });
    expect(within(after).getByText("Q17")).toBeInTheDocument();
    expect(within(after).getAllByText(/five days old/i).length).toBeGreaterThan(0);
    expect(within(after).getAllByText(/^answered$/i).length).toBeGreaterThan(0);
    expect(within(after).getAllByText(/^discarded$/i).length).toBeGreaterThan(0);
  });

  it("keeps the big question identical on both sides", () => {
    renderEnd();
    // The board pairs sit under one unchanged big question.
    const big = screen.getByText(/design a way to help a parent decide/i);
    expect(big).toBeInTheDocument();
    expect(screen.getAllByText(/design a way to help a parent decide/i)).toHaveLength(1);
  });

  it("summarises the change in counts", () => {
    renderEnd();
    expect(screen.getByText(/5 questions raised/i)).toBeInTheDocument();
  });

  it("offers replay and exit", () => {
    const onReplay = vi.fn();
    const onExit = vi.fn();
    render(<StoryEndCard onReplay={onReplay} onExit={onExit} />);
    expect(screen.getByRole("button", { name: /watch again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to the app/i })).toBeInTheDocument();
  });
});
