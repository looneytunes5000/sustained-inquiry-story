import { assetUrl } from "./asset";

/* Story content. Wording is verbatim from story/Story 2.docx — do not
   paraphrase. Scene titles and UI labels are the only authored copy.
   Numbering follows the docx "Final trail" table (the canonical scheme);
   panel 6's artwork already prints Q7 for "how old is the information". */

export type SceneId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type Stage = "Driving Question" | "QFT" | "Gather" | "Critique & Revision";

export interface StageDef {
  id: Stage;
  label: string;
  /* Scenes that belong to this stage, in play order. */
  sceneIds: SceneId[];
}
export type QuestionStatus =
  | "raised"
  | "reframed"
  | "prioritised"
  | "parked"
  | "answered"
  | "discarded"
  | "open";

export interface NtkQuestion {
  id: string;
  text: string;
  owner: "Tom" | "Priya" | "Felix" | "";
  status: QuestionStatus;
  fromId?: string;
  reframedAs?: string;
  /* What settled an answered/discarded question. Rendered in red and kept to
     one short line so it fits a square note without an ellipsis. */
  outcome?: string;
  /* A question that only exists because a prioritised question was answered.
     Children render nested under their parent in the pinned block. */
  parentId?: string;
}

export interface StoryScene {
  id: SceneId;
  title: string;
  image: string;
  /* Second panel sharing one narration track; cross-fades in mid-audio. */
  imageAlt?: string;
  audio: string;
  transcript: string;
  reveals: Partial<Record<string, Partial<NtkQuestion>>>;
}

export const BIG_QUESTION =
  "Design a way to help a parent decide whether to let a child swim here.";

export const BIG_QUESTION_FULL =
  "Design a way to help a parent decide whether to let a child swim here, based on what the evidence can and can't tell them.";

/* The four inquiry stages shown on the rail. All four now have scenes. */
export const STAGES: StageDef[] = [
  { id: "Driving Question", label: "Driving Question", sceneIds: [1] },
  { id: "QFT", label: "QFT", sceneIds: [2, 3, 4] },
  { id: "Gather", label: "Gather", sceneIds: [5, 6, 7, 8, 9, 10] },
  {
    id: "Critique & Revision",
    label: "Critique & Revision",
    sceneIds: [11, 12, 13, 14, 15],
  },
];

/* Base texts/owners. `status` here is the status at reveal; later scenes patch
   it. Nothing below Q8 exists yet at scene 6 — stage-appropriate only. */
export const NTK_QUESTIONS: NtkQuestion[] = [
  { id: "Q1", text: "Is the water clean?", owner: "Tom", status: "raised" },
  { id: "Q2", text: "Is there a lifeguard?", owner: "Tom", status: "raised" },
  { id: "Q3", text: "Safe from what?", owner: "Priya", status: "raised" },
  { id: "Q4", text: "Safe for who?", owner: "Priya", status: "raised" },
  { id: "Q5", text: "How old is the information on that sign?", owner: "Felix", status: "raised" },
  { id: "Q6", text: "What does “clean” mean, and who checked?", owner: "Tom", status: "raised", fromId: "Q1" },
  { id: "Q7", text: "How old is the information a parent sees?", owner: "Felix", status: "raised", fromId: "Q5" },
  { id: "Q8", text: "Is there an official rating?", owner: "Tom", status: "raised" },
  { id: "Q9", text: "Why did the AI say 35 in one chat and 104 in another?", owner: "Tom", status: "raised" },
  { id: "Q10", text: "Does the 2018 five-day-bacteria study exist?", owner: "Priya", status: "raised" },
  { id: "Q11", text: "Where were samples taken, and where do the kids swim?", owner: "Felix", status: "raised" },
  { id: "Q12", text: "What is the rating missing?", owner: "Tom", status: "raised" },
  { id: "Q13", text: "Are Saturdays actually crowded at the west end?", owner: "Felix", status: "raised" },
  { id: "Q14", text: "Would a sign showing test date, rain, and lifeguard hours change what parents decide?", owner: "", status: "open" },

  /* Children of the prioritised three. These exist only because an answer
     opened something new, which is the sustained-inquiry point: answering
     one question is how the next one is found. */
  { id: "Q15", text: "Should the sign say “last tested” or “safe today”?", owner: "Tom", status: "open", parentId: "Q6" },
  { id: "Q16", text: "Does the county test the creek mouth after rain?", owner: "Priya", status: "open", parentId: "Q3" },
  { id: "Q17", text: "Is there a safer hour to swim, given the lifeguard rota?", owner: "Felix", status: "open", parentId: "Q7" },
];

/* Reveal schedule, following the artwork scene by scene:
   S1 nothing · S2 Q1–Q5 · S3 nothing new · S4 Q6, Q7, Q4 parked ·
   S5 Q6/Q3/Q7 prioritised · S6 Q8 · S7 Q9 · S8 Q3 answered · S9 Q11 ·
   S10 Q12, Q8 discarded · S11 nothing new · S12 Q10 unresolved ·
   S13 Q13 · S14 Q14 open · S15 outcomes settled. */
export const STORY_SCENES: StoryScene[] = [
  {
    id: 1,
    title: "The Big Question",
    image: assetUrl("/story/scene-01.jpg"),
    audio: assetUrl("/story/scene-01.mp3"),
    transcript: "",
    reveals: {},
  },
  {
    id: 2,
    title: "Rules for Asking",
    image: assetUrl("/story/scene-02.jpg"),
    audio: assetUrl("/story/scene-02.mp3"),
    transcript: "",
    reveals: {
      Q1: { status: "raised" },
      Q2: { status: "raised" },
      Q3: { status: "raised" },
      Q4: { status: "raised" },
      Q5: { status: "raised" },
    },
  },
  {
    id: 3,
    title: "Sharper Questions",
    image: assetUrl("/story/scene-03.jpg"),
    audio: assetUrl("/story/scene-03.mp3"),
    transcript: "",
    reveals: {},
  },
  {
    id: 4,
    title: "Three Questions on the Wall",
    image: assetUrl("/story/scene-04a.jpg"),
    imageAlt: assetUrl("/story/scene-04b.jpg"),
    audio: assetUrl("/story/scene-04.mp3"),
    transcript: "",
    reveals: {
      Q6: { status: "prioritised" },
      Q3: { status: "prioritised" },
      Q7: { status: "prioritised" },
      Q4: { status: "parked" },
    },
  },
  {
    id: 5,
    title: "We Can Use AI?",
    image: assetUrl("/story/scene-05.jpg"),
    audio: assetUrl("/story/scene-05.mp3"),
    transcript: "",
    reveals: {
      Q6: { owner: "Tom" },
      Q3: { owner: "Priya" },
      Q7: { owner: "Felix" },
    },
  },
  {
    id: 6,
    title: "The Helpful Machine",
    image: assetUrl("/story/scene-06.jpg"),
    audio: assetUrl("/story/scene-06.mp3"),
    transcript: "",
    reveals: { Q8: { status: "raised" } },
  },
  {
    id: 7,
    title: "35 or 104?",
    image: assetUrl("/story/scene-07.jpg"),
    audio: assetUrl("/story/scene-07.mp3"),
    transcript: "",
    reveals: {
      Q9: { status: "answered", outcome: "Two limits, not one: 35 average, 104 single sample." },
      Q1: { status: "answered", outcome: "Latest result 61 — one number, one spot." },
      Q6: { status: "answered", outcome: "Under 100 bacteria; the county checks it." },
    },
  },
  {
    id: 8,
    title: "Safe From What?",
    image: assetUrl("/story/scene-08.jpg"),
    audio: assetUrl("/story/scene-08.mp3"),
    transcript: "",
    reveals: {
      Q3: {
        status: "answered",
        outcome: "Rain, not swimming, brings bacteria. Drowning is risk two.",
      },
      Q10: {
        status: "open",
        outcome: "Not found, so not used. Not proved fake.",
      },
    },
  },
  {
    id: 9,
    title: "Describing a Different Day",
    image: assetUrl("/story/scene-09.jpg"),
    audio: assetUrl("/story/scene-09.mp3"),
    transcript: "",
    reveals: {
      Q11: { status: "raised" },
      Q5: { status: "answered", outcome: "Sampled Monday; five days old by Saturday." },
      Q7: { status: "answered", outcome: "Up to five days old, on a separate page." },
      Q2: { status: "answered", outcome: "Weekends, 11–5. Empty flagpole = unwatched." },
    },
  },
  {
    id: 10,
    title: "What the Rating Is Missing",
    image: assetUrl("/story/scene-10.jpg"),
    audio: assetUrl("/story/scene-10.mp3"),
    transcript: "",
    reveals: {
      Q8: { status: "discarded", outcome: "Yes — but the wrong question. See Q12." },
      Q12: { status: "raised" },
    },
  },
  {
    id: 11,
    title: "A Hint, Not Proof",
    image: assetUrl("/story/scene-11.jpg"),
    audio: assetUrl("/story/scene-11.mp3"),
    transcript: "",
    reveals: {
      Q11: {
        status: "answered",
        outcome: "East end tested. West end never tested.",
      },
      Q3: {
        status: "answered",
        outcome: "Rain explains the bad results. Drowning still open.",
      },
      /* Answering Q3 opened a question about the creek itself. */
      Q16: { status: "open" },
    },
  },
  {
    id: 12,
    title: "Unresolved",
    image: assetUrl("/story/scene-12.jpg"),
    audio: assetUrl("/story/scene-12.mp3"),
    transcript: "",
    reveals: {
      Q10: {
        status: "answered",
        outcome: "Unresolved, not disproved. Not found, so not used.",
      },
    },
  },
  {
    id: 13,
    title: "Which Parts Did You Assume?",
    image: assetUrl("/story/scene-13.jpg"),
    audio: assetUrl("/story/scene-13.mp3"),
    transcript: "",
    reveals: {
      Q13: { status: "raised" },
      Q12: {
        status: "open",
        outcome: "Missing the west end, weather, hours, and age.",
      },
      /* Answering Q6 opened a drafting question about wording. */
      Q15: { status: "open" },
    },
  },
  {
    id: 14,
    title: "What Would Make You Wrong?",
    image: assetUrl("/story/scene-14.jpg"),
    audio: assetUrl("/story/scene-14.mp3"),
    transcript: "",
    reveals: {
      Q14: {
        status: "open",
        outcome: "Open. A date alone repeats the green “Good” problem.",
      },
      Q4: {
        status: "parked",
        outcome: "Parked, not dropped — the brother question.",
      },
      /* Answering Q7 opened a question about timing within the week. */
      Q17: { status: "open" },
    },
  },
  {
    id: 15,
    title: "What the Wall Finally Said",
    image: assetUrl("/story/scene-15.jpg"),
    audio: assetUrl("/story/scene-15.mp3"),
    transcript: "",
    // The closing scene restates the wall; it does not add to it. Everything
    // on the board here was already settled by the scene that found it.
    reveals: {},
  },
];

/* The three questions the team voted to prioritise. Held as ids rather than
   read off `status` so the group survives those questions being answered —
   the choice is part of the record, not a transient state. */
export const PRIORITY_QUESTION_IDS = ["Q6", "Q3", "Q7"];

export const END_CARD = {
  heading: "That's where we stop — for now.",
  line: "That big question never changes. Everything around it should look different by week six.",
};
