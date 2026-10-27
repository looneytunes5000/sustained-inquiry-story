/* Pure story logic — no React, no DOM. Keeping the reveal schedule and lock
   rules here lets them be tested against the manifest directly. */

import {
  NTK_QUESTIONS,
  STAGES,
  STORY_SCENES,
  type NtkQuestion,
  type SceneId,
  type StageDef,
} from "./story-manifest";

export interface WallCard extends NtkQuestion {
  revealedAt: SceneId;
}

const SCENE_IDS: SceneId[] = STORY_SCENES.map((s) => s.id);
const LAST_SCENE: SceneId = SCENE_IDS[SCENE_IDS.length - 1];

/** Applied patches are cumulative only up to `scene`, never beyond it, so
 *  jumping back shows exactly the same wall as watching forwards. */
export function cardsAtScene(scene: SceneId): WallCard[] {
  const revealed: Record<string, WallCard> = {};
  for (const s of STORY_SCENES) {
    if (s.id > scene) break;
    for (const [id, patch] of Object.entries(s.reveals)) {
      const base = NTK_QUESTIONS.find((q) => q.id === id);
      if (!base) continue;
      revealed[id] = {
        ...(revealed[id] ?? { ...base, revealedAt: s.id }),
        ...patch,
      };
    }
  }
  return Object.values(revealed);
}

export function isSceneUnlocked(scene: SceneId, furthest: SceneId): boolean {
  return scene <= furthest;
}

/** The stage a scene belongs to. Every produced scene must belong to one. */
export function stageForScene(scene: SceneId): StageDef {
  const stage = STAGES.find((s) => s.sceneIds.includes(scene));
  if (!stage) throw new Error(`Scene ${scene} has no stage`);
  return stage;
}

/** A stage is reachable once its opening scene has been reached. */
export function isStageUnlocked(stage: StageDef, furthest: SceneId): boolean {
  const first = stage.sceneIds[0];
  return first !== undefined && first <= furthest;
}

export function nextScene(scene: SceneId): SceneId | null {
  return scene < LAST_SCENE ? ((scene + 1) as SceneId) : null;
}

export function prevScene(scene: SceneId): SceneId | null {
  return scene > 1 ? ((scene - 1) as SceneId) : null;
}

const clampScene = (n: number): SceneId =>
  Math.min(Math.max(n, 1), LAST_SCENE) as SceneId;

/** Furthest reached, read from the generic responses store. The DB column is an
 *  integer and 0 is not a real section, so ["0"] is the story's reserved slot. */
export function furthestFromResponses(
  responses: Record<string, Record<string, string>>,
): SceneId {
  const raw = responses["0"]?.story_furthest;
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) ? clampScene(n) : 1;
}

export { SCENE_IDS };
