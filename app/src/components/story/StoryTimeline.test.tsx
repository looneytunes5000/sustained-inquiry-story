import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import StoryTimeline from "./StoryTimeline";

afterEach(cleanup);

function renderRail(overrides: Partial<Parameters<typeof StoryTimeline>[0]> = {}) {
  const onSelect = vi.fn();
  const onLockedSelect = vi.fn();
  render(
    <StoryTimeline
      current="QFT"
      furthest={3}
      onSelect={onSelect}
      onLockedSelect={onLockedSelect}
      {...overrides}
    />,
  );
  return { onSelect, onLockedSelect };
}

describe("StoryTimeline (four-stage rail)", () => {
  it("renders exactly the four inquiry stages", () => {
    renderRail();
    for (const label of ["Driving Question", "QFT", "Gather", "Critique & Revision"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("marks the active stage with aria-current", () => {
    renderRail();
    expect(screen.getByRole("button", { name: /QFT/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("routes an unlocked stage click to onSelect", async () => {
    const user = userEvent.setup();
    const { onSelect, onLockedSelect } = renderRail();
    await user.click(screen.getByRole("button", { name: /Driving Question/ }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "Driving Question" }),
    );
    expect(onLockedSelect).not.toHaveBeenCalled();
  });

  it("routes a locked stage to onLockedSelect and never onSelect", async () => {
    const user = userEvent.setup();
    const { onSelect, onLockedSelect } = renderRail();
    await user.click(screen.getByRole("button", { name: /Gather/ }));
    expect(onLockedSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "Gather" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps a locked stage visible and exposes the lock via aria-disabled", () => {
    renderRail();
    const gather = screen.getByRole("button", { name: /Gather/ });
    expect(gather).toHaveAttribute("aria-disabled", "true");
    expect(gather).toBeVisible();
  });

  it("keeps the last stage locked until scene 10 is reached", async () => {
    const user = userEvent.setup();
    const { onSelect, onLockedSelect } = renderRail({ furthest: 9 });
    const critique = screen.getByRole("button", { name: /Critique & Revision/ });
    expect(critique).toHaveAttribute("aria-disabled", "true");

    await user.click(critique);
    expect(onLockedSelect).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
