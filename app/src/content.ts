/* All trainee-facing copy lives here or comes from GET /api/config.
   Spec-drafted text is verbatim from spec.docx — do not paraphrase. */

export type SectionId = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionDef {
  id: SectionId;
  kicker: string;
  title: string;
  route: string;
  phase2?: boolean; // deferred: locked in nav
}

export const SECTIONS: SectionDef[] = [
  { id: 1, kicker: "Section 1", title: "The Provocation", route: "/section/1" },
  { id: 2, kicker: "Section 2", title: "The Inquiry Cycle", route: "/section/2" },
  { id: 3, kicker: "Section 3", title: "Sort-It-Out", route: "/section/3", phase2: true },
  { id: 4, kicker: "Section 4", title: "Self-Check Quiz", route: "/section/4" },
  { id: 5, kicker: "Section 5", title: "QFT Practice", route: "/section/5", phase2: true },
  { id: 6, kicker: "Section 6", title: "Your Module", route: "/section/6" },
];

/** Sections that must be complete before /done unlocks. S3+S5 are phase 2. */
export const REQUIRED_SECTIONS: SectionId[] = [1, 2, 4, 6];

export const LANDING = {
  title: "Sustained Inquiry: Pre-Session Prep",
  /* Spec §4-S0 intro, with the section count aligned to what actually ships in
     this build (the spec's "all 6 sections" assumed S3 + S5, which are phase 2). */
  intro:
    "In our upcoming session, we'll practice designing inquiry-driven projects. This pre-work will introduce the key concept — Sustained Inquiry — so we can spend our live time practicing, not lecturing. Please complete the 4 core sections before the session — 2 further sections arrive in a later phase.",
  timeEstimate: "approx. 30–40 minutes",
};

/* S1 provocation. Spec §4-S1 allows a text-based scenario comparison while the
   video does not exist yet (Appendix A), which is what ships here. Flip
   video.enabled in api/config.php to swap in the real clip. Both scenario
   texts are verbatim from Appendix A. */
export const PROVOCATION = {
  framing:
    "Two teachers, the same topic — structural engineering. Read both scenarios, then answer the reflection below.",
  scenarios: [
    {
      id: "a",
      label: "Scenario A",
      title: "Lecture, then project",
      body: "Mr. Tan teaches a module on structural engineering. He lectures for 2 weeks on load-bearing principles, then assigns students to build a model bridge based on a fixed set of instructions. Students follow the steps, submit their bridge, and receive a grade.",
      tone: "muted" as const,
    },
    {
      id: "b",
      label: "Scenario B",
      title: "A genuine inquiry cycle",
      body: "Ms. Lee teaches the same topic. She starts by showing students a video of a real bridge collapse and asks: 'What questions come to mind?' Students generate questions, investigate load-bearing principles to answer them, build a prototype, test it to failure, discover new problems, and revise their design — repeating this cycle twice before their final presentation.",
      tone: "accent" as const,
    },
  ],
};

/* S1 stub copy: config.php's video.label / video.hint are authoritative and
   reach the frontend via GET /api/config; these are only the offline fallback
   for when that request fails, so the section never renders blank. */
export const S1 = {
  reflectionPrompt:
    "What differences did you notice between the two approaches? (2-3 sentences)",
  reflectionField: "reflection_video",
};

export const S6 = {
  framing:
    "Think about a module you currently teach. This reflection will be pulled into our live session, so be as specific as you can — no need for a polished answer.",
  fields: [
    {
      name: "module_topic",
      label: "What module/subject do you teach?",
      long: false,
      required: true,
    },
    {
      name: "module_problem",
      label: "What's one real-world problem related to this module that could interest students?",
      long: true,
      required: true,
    },
    {
      name: "module_entry_event",
      label: "What's one entry event idea (video, object, guest speaker, field trip) that could introduce this problem?",
      long: true,
      required: true,
    },
    {
      name: "module_questions",
      label: "What questions do you think students might naturally ask about this problem? (optional)",
      long: true,
      required: false,
    },
  ],
};

/* ---------- Section 2: The Inquiry Cycle ---------- */

export const CYCLE_NODES = [
  {
    id: "entry-event",
    n: 1,
    title: "Entry Event",
    definition:
      "A provocation (video, object, guest, field trip) that sparks curiosity about a real problem.",
  },
  {
    id: "generate-questions",
    n: 2,
    title: "Generate Questions",
    definition:
      "Students ask what they need to know — not the teacher telling them.",
  },
  {
    id: "investigate",
    n: 3,
    title: "Investigate",
    definition: "Students research, interview, experiment to find answers.",
  },
  {
    id: "apply-test",
    n: 4,
    title: "Apply & Test",
    definition:
      "Students use findings in a prototype, draft, or solution — then test it.",
  },
  {
    id: "new-questions",
    n: 5,
    title: "New Questions Emerge",
    definition: "Testing reveals gaps → cycle repeats.",
  },
] as const;

export type CycleNodeId = (typeof CYCLE_NODES)[number]["id"];
export type Discipline =
  | "engineering"
  | "business"
  | "health"
  | "it"
  | "design"
  | "hospitality";

export const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: "engineering", label: "Engineering" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health Sciences" },
  { id: "it", label: "IT" },
  { id: "design", label: "Design" },
  { id: "hospitality", label: "Hospitality" },
];

/* Landing asks for a subject area and promises it tailors the examples; this is
   the mapping that keeps that promise. Free text is matched against the labels
   and ids first, then against common VTC subject words. */
const DISCIPLINE_ALIASES: Record<Discipline, string[]> = {
  engineering: [
    "engineering", "mechanical", "electrical", "civil", "building services", "construction",
    "cad", "workshop", "infrastructure", "manufacturing", "installation",
  ],
  business: [
    "business", "marketing", "accounting", "management", "commerce", "finance", "retail",
    "sales", "administration", "human resources", "logistics", "secretarial",
  ],
  health: [
    "health", "nursing", "medical", "dental", "pharmacy", "pharmac", "anatomy", "physiology",
    "clinical", "patient", "therapy", "nutrition", "dietetics", "biomedical",
  ],
  it: [
    "it", "information technology", "computing", "computer", "software", "ict", "cyber",
    "web", "programming", "database", "network", "systems", "application development",
  ],
  design: [
    "design", "visual communication", "graphic", "product design", "fashion", "interior",
    "animation", "illustration",
  ],
  hospitality: [
    "hospitality", "hotel", "tourism", "food and beverage", "f&b", "culinary", "catering",
    "front office", "guest", "housekeeping", "restaurant", "travel", "airline",
  ],
};

export function disciplineFromSubject(subject: string | null | undefined): Discipline | null {
  const s = (subject ?? "").trim().toLowerCase();
  if (!s) return null;
  for (const d of DISCIPLINES) {
    if (d.id === s || d.label.toLowerCase() === s) return d.id;
  }
  for (const [id, aliases] of Object.entries(DISCIPLINE_ALIASES) as [Discipline, string[]][]) {
    if (aliases.some((a) => s.includes(a))) return id;
  }
  return null;
}

/* Appendix B (spec Table 4) + stage-consistent extensions: one example
   per node per discipline, so every node visit shows a vocational example. */
export const CYCLE_EXAMPLES: Record<CycleNodeId, Record<Discipline, string>> = {
  "entry-event": {
    engineering: "Show a video of a real bridge or structure failure.",
    business: "A struggling local small business visits as guest speaker.",
    health: "A case study of a patient living with a chronic condition.",
    it: "A sanitised real-world data breach case.",
    design: "A client brief from a real local company.",
    hospitality: "Real guest-complaint data from a hotel.",
  },
  "generate-questions": {
    engineering:
      "“How might we design a structure that withstands X load using minimal material?”",
    business: "“How can we help [Business Name] increase customer retention?”",
    health: "“How might we design a care plan that improves adherence to treatment?”",
    it: "“How can we design a system that better protects user data?”",
    design:
      "“How might we redesign this product to be more accessible for elderly users?”",
    hospitality:
      "“How can we redesign the guest check-in experience to reduce wait times?”",
  },
  investigate: {
    engineering:
      "Teams research loads and materials, and interview a practising engineer.",
    business:
      "Students survey customers and analyse sales data to find why people leave.",
    health: "Students research treatment barriers and interview a practising nurse.",
    it: "Students trace how the breach happened and study authentication best practice.",
    design:
      "Students observe elderly users with the product and note where they struggle.",
    hospitality: "Students time the check-in process and shadow front-desk staff.",
  },
  "apply-test": {
    engineering:
      "Build a scale bridge and load it to failure — compare with predictions.",
    business: "Pitch a retention plan to the owner and trial it for two weeks.",
    health: "Draft a care plan and pilot it with simulated patients for feedback.",
    it: "Build a hardened prototype, then run a mock phishing test against it.",
    design: "Prototype the redesign and usability-test it with elderly users.",
    hospitality: "Redesign the check-in flow and role-play it with classmates as guests.",
  },
  "new-questions": {
    engineering:
      "The joint failed before the beam — why? New questions about connections.",
    business:
      "The trial kept regulars but not new customers — what problem is this really?",
    health:
      "Patients understood the plan but still forgot doses — what else drives adherence?",
    it: "The mock attack came through email, not the login page — where else are we exposed?",
    design:
      "Elderly users managed it, but gave up before finding the key feature — why?",
    hospitality:
      "Queues shortened but complaints rose — what did the new flow lose?",
  },
};
