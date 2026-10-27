import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import StoryRail from "./StoryRail";

afterEach(cleanup);

describe("StoryRail (flanking note columns)", () => {
  it("says nothing is on the wall at scene 1 and renders no notes", () => {
    render(<StoryRail scene={1} />);
    expect(screen.getByText(/nothing on the wall yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Q1")).not.toBeInTheDocument();
  });

  it("lists Q1–Q5 at scene 3", () => {
    render(<StoryRail scene={3} />);
    for (const id of ["Q1", "Q2", "Q3", "Q4", "Q5"]) {
      expect(screen.getByText(id)).toBeInTheDocument();
    }
    expect(screen.queryByText("Q6")).not.toBeInTheDocument();
  });

  it("shows no RAISED or PARKED stamp — plain notes stay plain", () => {
    render(<StoryRail scene={4} />);
    expect(screen.queryByText(/^raised$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^parked$/i)).not.toBeInTheDocument();
    // A meaningful stamp still renders.
    expect(screen.getAllByText(/^prioritised$/i).length).toBeGreaterThan(0);
  });

  it("has no pinned block before the questions are chosen", () => {
    render(<StoryRail scene={3} />);
    expect(
      screen.queryByRole("region", { name: /three prioritised/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/the three we chose/i)).not.toBeInTheDocument();
  });

  it("shows the pinned block from scene 4 onward", () => {
    render(<StoryRail scene={4} />);
    expect(
      screen.getByRole("region", { name: /three prioritised/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/the three we chose/i)).toBeInTheDocument();
  });

  it("renders one wall, not a split pair of columns", () => {
    render(<StoryRail scene={3} />);
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    const wall = screen.getByRole("complementary");
    for (const id of ["Q1", "Q2", "Q3", "Q4", "Q5"]) {
      expect(within(wall).getByText(id)).toBeInTheDocument();
    }
  });

  it("pins the three chosen questions in one block, above everything else", () => {
    render(<StoryRail scene={6} />);
    const pinned = screen.getByRole("region", { name: /three prioritised/i });
    expect(within(pinned).getByText("Q6")).toBeInTheDocument();
    expect(within(pinned).getByText("Q3")).toBeInTheDocument();
    expect(within(pinned).getByText("Q7")).toBeInTheDocument();
    // The other questions live outside the pinned block.
    expect(within(pinned).queryByText("Q1")).not.toBeInTheDocument();

    const other = screen.getByRole("region", { name: /other questions/i });
    expect(within(other).getByText("Q1")).toBeInTheDocument();
    expect(within(other).getByText("Q8")).toBeInTheDocument();
    expect(within(other).queryByText("Q6")).not.toBeInTheDocument();
  });

  it("keeps the pinned three pinned even after they are answered", () => {
    render(<StoryRail scene={15} />);
    const pinned = screen.getByRole("region", { name: /three prioritised/i });
    expect(within(pinned).getByText("Q6")).toBeInTheDocument();
    expect(within(pinned).getByText("Q3")).toBeInTheDocument();
    expect(within(pinned).getByText("Q7")).toBeInTheDocument();
  });

  it("strikes through an answered question and shows what settled it", () => {
    render(<StoryRail scene={8} />);
    const q3 = screen.getByText("Q3").closest("article")!;
    expect(q3).toHaveTextContent(/answered/i);
    expect(q3).toHaveTextContent(/bacteria/i);
    expect(within(q3).getByText("Safe from what?")).toHaveClass("line-through");
  });

  it("keeps an open question un-struck", () => {
    render(<StoryRail scene={14} />);
    const q14 = screen.getByText("Q14").closest("li")!;
    expect(q14).toHaveTextContent(/open/i);
    expect(within(q14).getByText(/would a sign showing test date/i)).not.toHaveClass(
      "line-through",
    );
  });

  it("renders an answer in red rather than a muted tone", () => {
    render(<StoryRail scene={9} />);
    const q6 = screen.getByText("Q6").closest("article")!;
    const answer = within(q6).getByText(/100 bacteria/i);
    expect(answer).toHaveClass("text-marker");
  });

  it("hangs a new question beneath the prioritised one that opened it", () => {
    render(<StoryRail scene={13} />);
    const pinned = screen.getByRole("region", { name: /three prioritised/i });
    expect(within(pinned).getByText("Q15")).toBeInTheDocument();
    expect(within(pinned).getByText(/last tested/i)).toBeInTheDocument();

    // It does not also appear in the general grid.
    const other = screen.getByRole("region", { name: /other questions/i });
    expect(within(other).queryByText("Q15")).not.toBeInTheDocument();
  });

  it("shows no child before its parent has been answered", () => {
    render(<StoryRail scene={9} />);
    expect(screen.queryByText("Q15")).not.toBeInTheDocument();
  });

  it("shows lineage for questions born from another", () => {
    render(<StoryRail scene={4} />);
    expect(screen.getByText(/↳ Q1/)).toBeInTheDocument();
    expect(screen.getByText(/↳ Q5/)).toBeInTheDocument();
  });

  it("never leaks questions from later scenes", () => {
    render(<StoryRail scene={6} />);
    for (const id of ["Q9", "Q10", "Q11", "Q12", "Q13", "Q14"]) {
      expect(screen.queryByText(id)).not.toBeInTheDocument();
    }
  });

  it("never removes a note already revealed", () => {
    render(<StoryRail scene={6} />);
    for (const id of ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"]) {
      expect(screen.getByText(id)).toBeInTheDocument();
    }
  });
});
