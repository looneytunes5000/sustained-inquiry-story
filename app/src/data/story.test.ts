import { describe, expect, it } from "vitest";
import {
  BIG_QUESTION,
  NTK_QUESTIONS,
  STAGES,
  STORY_SCENES,
} from "./story-manifest";
import {
  cardsAtScene,
  furthestFromResponses,
  isSceneUnlocked,
  isStageUnlocked,
  nextScene,
  stageForScene,
} from "./story";

describe("story manifest", () => {
  it("has exactly fifteen scenes, numbered 1..15 in order", () => {
    expect(STORY_SCENES.map((s) => s.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it("points every scene at its own numbered audio asset", () => {
    for (const scene of STORY_SCENES) {
      const nn = String(scene.id).padStart(2, "0");
      expect(scene.audio).toBe(`/story/scene-${nn}.mp3`);
      expect(scene.image).toMatch(/^\/story\/scene-\d{2}[ab]?\.jpg$/);
    }
  });

  it("gives only scene 4 a second panel sharing its narration", () => {
    const withAlt = STORY_SCENES.filter((s) => s.imageAlt);
    expect(withAlt.map((s) => s.id)).toEqual([4]);
    expect(STORY_SCENES[3].imageAlt).toBe("/story/scene-04b.jpg");
  });

  it("uses canonical Q-numbers with no gaps and no duplicates", () => {
    const ids = NTK_QUESTIONS.map((q) => q.id).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    expect(new Set(ids).size).toBe(ids.length);
    // Q1–Q14 are the story's own questions; Q15–Q17 are raised later by
    // answers, so the canonical set is the contiguous run through Q17.
    expect(ids).toEqual(Array.from({ length: 17 }, (_, i) => `Q${i + 1}`));
  });

  it("keeps the big question verbatim", () => {
    expect(BIG_QUESTION).toBe(
      "Design a way to help a parent decide whether to let a child swim here.",
    );
  });

  it("covers every scene id in exactly one of the four stages", () => {
    const grouped = STAGES.flatMap((s) => s.sceneIds);
    expect(grouped.sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
    expect(STAGES.map((s) => s.id)).toEqual([
      "Driving Question",
      "QFT",
      "Gather",
      "Critique & Revision",
    ]);
  });

  it("splits the stages 1 / 3 / 6 / 5", () => {
    expect(STAGES.map((s) => s.sceneIds.length)).toEqual([1, 3, 6, 5]);
  });
});

describe("story logic", () => {
  const idsAt = (scene: Parameters<typeof cardsAtScene>[0]) =>
    cardsAtScene(scene)
      .map((c) => c.id)
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

  it("reveals nothing at scene 1", () => {
    expect(cardsAtScene(1)).toEqual([]);
  });

  it("reveals exactly Q1–Q5 at scene 2, all raised", () => {
    expect(idsAt(2)).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5"]);
    expect(cardsAtScene(2).every((c) => c.status === "raised")).toBe(true);
  });

  it("adds nothing new at scene 3", () => {
    expect(idsAt(3)).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5"]);
  });

  it("adds Q6 and Q7 and parks Q4 at scene 4", () => {
    expect(idsAt(4)).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"]);
    const cards = cardsAtScene(4);
    expect(cards.find((c) => c.id === "Q4")!.status).toBe("parked");
    expect(cards.find((c) => c.id === "Q6")!.fromId).toBe("Q1");
  });

  it("prioritises Q6/Q3/Q7 at scene 4, when the team chooses them", () => {
    const at4 = cardsAtScene(4);
    for (const id of ["Q6", "Q3", "Q7"]) {
      expect(at4.find((c) => c.id === id)!.status).toBe("prioritised");
    }
    // Scene 3 has nothing prioritised yet (Q3 exists but is still plain).
    expect(
      cardsAtScene(3).some((c) => c.status === "prioritised"),
    ).toBe(false);
    // Scene 5 adds the owners without changing the priority status.
    const at5 = cardsAtScene(5);
    expect(at5.find((c) => c.id === "Q6")!.owner).toBe("Tom");
    expect(at5.find((c) => c.id === "Q6")!.status).toBe("prioritised");
  });

  it("reveals Q8 at scene 6 and Q9 at scene 7", () => {
    expect(idsAt(6)).toContain("Q8");
    expect(idsAt(6)).not.toContain("Q9");
    expect(idsAt(7)).toContain("Q9");
  });

  it("settles Q9, Q1 and Q6 at scene 7, where the numbers are untangled", () => {
    const at7 = cardsAtScene(7);
    for (const id of ["Q9", "Q1", "Q6"]) {
      expect(at7.find((c) => c.id === id)!.status).toBe("answered");
    }
  });

  it("marks Q3 answered and Q10 unresolved at scene 8", () => {
    const at8 = cardsAtScene(8);
    expect(at8.find((c) => c.id === "Q3")!.status).toBe("answered");
    expect(at8.find((c) => c.id === "Q3")!.outcome).toMatch(/bacteria/i);
    expect(at8.find((c) => c.id === "Q10")!.status).toBe("open");
  });

  it("settles Q5, Q7 and Q2 at scene 9, the timeline scene", () => {
    const at9 = cardsAtScene(9);
    for (const id of ["Q5", "Q7", "Q2"]) {
      expect(at9.find((c) => c.id === id)!.status).toBe("answered");
    }
    expect(idsAt(9)).toContain("Q11");
  });

  it("discards Q8 and raises Q12 at scene 10", () => {
    const at10 = cardsAtScene(10);
    expect(at10.find((c) => c.id === "Q8")!.status).toBe("discarded");
    expect(at10.find((c) => c.id === "Q12")).toBeTruthy();
  });

  it("answers Q11 and sharpens Q3 at scene 11", () => {
    const at11 = cardsAtScene(11);
    expect(at11.find((c) => c.id === "Q11")!.status).toBe("answered");
    expect(at11.find((c) => c.id === "Q3")!.outcome).toMatch(/drowning/i);
  });

  it("closes Q10 as unresolved at scene 12 and opens Q13/Q14", () => {
    expect(cardsAtScene(12).find((c) => c.id === "Q10")!.status).toBe("answered");
    expect(idsAt(13)).toContain("Q13");
    expect(idsAt(14)).toContain("Q14");
  });

  it("changes nothing at the closing scene — the wall is already complete", () => {
    expect(JSON.stringify(cardsAtScene(15))).toBe(JSON.stringify(cardsAtScene(14)));
    expect(cardsAtScene(15)).toHaveLength(17);
    expect(cardsAtScene(15).find((c) => c.id === "Q13")!.status).toBe("raised");
    expect(cardsAtScene(15).find((c) => c.id === "Q14")!.status).toBe("open");
  });

  it("makes each prioritised question yield its own answer", () => {
    const cards = cardsAtScene(9);
    const q6 = cards.find((c) => c.id === "Q6")!.outcome!;
    const q7 = cards.find((c) => c.id === "Q7")!.outcome!;
    // Similar questions, different answers: "clean" resolves to a threshold,
    // freshness to an age.
    expect(q6).toMatch(/100 bacteria/i);
    expect(q7).toMatch(/five days/i);
    expect(q6).not.toBe(q7);
  });

  it("grows new questions from answered prioritised ones", () => {
    // Each child names the parent that opened it, and appears only after it.
    const children = NTK_QUESTIONS.filter((q) => q.parentId);
    expect(children.map((c) => [c.id, c.parentId])).toEqual([
      ["Q15", "Q6"],
      ["Q16", "Q3"],
      ["Q17", "Q7"],
    ]);
    for (const child of children) {
      const reveal = STORY_SCENES.find((s) => s.reveals[child.id]);
      expect(reveal).toBeTruthy();
      const parentAnsweredAt = STORY_SCENES.find(
        (s) => s.reveals[child.parentId!]?.status === "answered",
      )!;
      expect(reveal!.id).toBeGreaterThanOrEqual(parentAnsweredAt.id);
    }
  });

  it("keeps every answer short enough for a square note", () => {
    for (const scene of STORY_SCENES) {
      for (const patch of Object.values(scene.reveals)) {
        if (patch?.outcome) {
          // ~72 chars is the most a square note shows without an ellipsis.
          expect(patch.outcome.length).toBeLessThanOrEqual(72);
        }
      }
    }
  });

  it("spreads the settlements across scenes instead of dumping them at the end", () => {
    // An answered/discarded note appears at each of the scenes that found
    // something, not in one batch at the close.
    const settledByScene = [7, 8, 9, 10, 11, 12].map(
      (s) =>
        cardsAtScene(s as Parameters<typeof cardsAtScene>[0]).filter(
          (c) => c.status === "answered" || c.status === "discarded",
        ).length,
    );
    for (let i = 1; i < settledByScene.length; i++) {
      expect(settledByScene[i]).toBeGreaterThanOrEqual(settledByScene[i - 1]);
    }
    expect(settledByScene[0]).toBeGreaterThan(0);
  });

  it("unlocks only scenes at or before the furthest reached", () => {
    expect(isSceneUnlocked(3, 3)).toBe(true);
    expect(isSceneUnlocked(2, 3)).toBe(true);
    expect(isSceneUnlocked(4, 3)).toBe(false);
    expect(isSceneUnlocked(15, 3)).toBe(false);
  });

  it("advances 1→2 … 14→15 and stops after 15", () => {
    expect(nextScene(1)).toBe(2);
    expect(nextScene(14)).toBe(15);
    expect(nextScene(15)).toBeNull();
  });

  it("maps each scene to its stage", () => {
    expect(stageForScene(1).id).toBe("Driving Question");
    expect(stageForScene(2).id).toBe("QFT");
    expect(stageForScene(4).id).toBe("QFT");
    expect(stageForScene(5).id).toBe("Gather");
    expect(stageForScene(10).id).toBe("Gather");
    expect(stageForScene(11).id).toBe("Critique & Revision");
    expect(stageForScene(15).id).toBe("Critique & Revision");
  });

  it("unlocks stages by their opening scene", () => {
    const [driving, qft, gather, critique] = STAGES;
    expect(isStageUnlocked(driving, 1)).toBe(true);
    expect(isStageUnlocked(qft, 1)).toBe(false);
    expect(isStageUnlocked(qft, 2)).toBe(true);
    expect(isStageUnlocked(gather, 4)).toBe(false);
    expect(isStageUnlocked(gather, 5)).toBe(true);
    expect(isStageUnlocked(critique, 10)).toBe(false);
    expect(isStageUnlocked(critique, 11)).toBe(true);
  });

  it("round-trips furthest through the responses store", () => {
    expect(furthestFromResponses({})).toBe(1);
    expect(furthestFromResponses({ "0": { story_furthest: "4" } })).toBe(4);
    expect(furthestFromResponses({ "0": { story_furthest: "banana" } })).toBe(1);
    expect(furthestFromResponses({ "0": { story_furthest: "99" } })).toBe(15);
  });
});
