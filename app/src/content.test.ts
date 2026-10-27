import { describe, expect, it } from "vitest";
import { CYCLE_EXAMPLES, CYCLE_NODES, DISCIPLINES, disciplineFromSubject } from "./content";

/* The landing form promises subject area tailors the S2 examples — these tests
   pin the mapping that keeps that promise. */
describe("disciplineFromSubject", () => {
  it("matches the datalist labels and ids exactly", () => {
    expect(disciplineFromSubject("Engineering")).toBe("engineering");
    expect(disciplineFromSubject("Health Sciences")).toBe("health");
    expect(disciplineFromSubject("IT")).toBe("it");
    expect(disciplineFromSubject("hospitality")).toBe("hospitality");
  });

  it("matches common VTC subject wording, including the dashboard's spelling", () => {
    expect(disciplineFromSubject("Information Technology")).toBe("it");
    expect(disciplineFromSubject("Web Application Development")).toBe("it");
    expect(disciplineFromSubject("Front Office Operations")).toBe("hospitality");
    expect(disciplineFromSubject("Structural Engineering Fundamentals")).toBe("engineering");
    expect(disciplineFromSubject("Visual Communication")).toBe("design");
    expect(disciplineFromSubject("Anatomy and Physiology")).toBe("health");
    expect(disciplineFromSubject("Principles of Marketing")).toBe("business");
  });

  it("returns null for empty or unrecognised input so the caller can fall back", () => {
    expect(disciplineFromSubject("")).toBeNull();
    expect(disciplineFromSubject(null)).toBeNull();
    expect(disciplineFromSubject(undefined)).toBeNull();
    expect(disciplineFromSubject("Something entirely unrelated")).toBeNull();
  });
});

describe("cycle example coverage", () => {
  it("every node has an example for every discipline", () => {
    for (const node of CYCLE_NODES) {
      for (const d of DISCIPLINES) {
        expect(CYCLE_EXAMPLES[node.id][d.id]?.length ?? 0).toBeGreaterThan(10);
      }
    }
  });
});
