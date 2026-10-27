import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, type AppConfig, type TraineeState } from "./api";
import { REQUIRED_SECTIONS, type SectionId } from "./content";

interface SessionCtx {
  ready: boolean;
  user: TraineeState["user"] | null;
  progress: TraineeState["progress"];
  responses: TraineeState["responses"];
  quiz: TraineeState["quiz"];
  config: AppConfig | null;
  completedCount: number;
  isComplete: (id: SectionId) => boolean;
  enter: (name: string, email: string, subject: string) => Promise<void>;
  saveResponse: (sectionId: number, field: string, value: string) => Promise<void>;
  markStarted: (id: SectionId) => void;
  markCompleted: (id: SectionId) => void;
  recordQuiz: (questionId: number, selected: string, isCorrect: boolean) => void;
  applyState: (s: TraineeState) => void;
  forget: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<TraineeState | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const email = useRef<string>("");

  useEffect(() => {
    // Resume: same email picks up where it left off (spec §4-S0).
    api
      .config()
      .then(setConfig)
      .catch(() => {});
    const saved = localStorage.getItem("pbl:email");
    const load = saved
      ? api.state(saved)
      : Promise.reject(new Error("no session"));
    load
      .then((s) => {
        email.current = s.user.email;
        setState(s);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const applyState = useCallback((s: TraineeState) => {
    email.current = s.user.email;
    localStorage.setItem("pbl:email", s.user.email);
    setState(s);
  }, []);

  const forget = useCallback(() => {
    localStorage.removeItem("pbl:email");
    email.current = "";
    setState(null);
  }, []);

  const value: SessionCtx = useMemo(
    () => ({
      ready,
      config,
      user: state?.user ?? null,
      progress: state?.progress ?? {},
      responses: state?.responses ?? {},
      quiz: state?.quiz ?? {},
      completedCount: REQUIRED_SECTIONS.filter(
        (id) => state?.progress[String(id)]?.completed,
      ).length,
      isComplete: (id) => !!state?.progress[String(id)]?.completed,
      enter: async (name, mail, subject) => applyState(await api.entry(name, mail, subject)),
      applyState,
      forget,
      saveResponse: async (sectionId, field, val) => {
        // optimistic local update, then persist
        setState(
          (s) =>
            s && {
              ...s,
              responses: {
                ...s.responses,
                [sectionId]: { ...s.responses[sectionId], [field]: val },
              },
            },
        );
        await api.response(email.current, sectionId, field, val);
      },
      markStarted: (id) => {
        void api.progress(email.current, id, "started");
      },
      markCompleted: (id) => {
        void api.progress(email.current, id, "completed");
        setState(
          (s) =>
            s && {
              ...s,
              progress: { ...s.progress, [id]: { started: true, completed: true } },
            },
        );
      },
      recordQuiz: (qid, selected, isCorrect) => {
        void api.quiz(email.current, qid, selected, isCorrect);
        setState((s) => {
          if (!s) return s;
          const prev = s.quiz[qid];
          return {
            ...s,
            quiz: {
              ...s.quiz,
              [qid]: {
                selected_option: selected,
                // First attempt decides the score permanently: later clicks and
                // retries must never erase credit already earned, nor create it.
                is_correct: prev ? prev.is_correct : isCorrect,
                attempts: (prev?.attempts ?? 0) + 1,
              },
            },
          };
        });
      },
    }),
    [ready, config, state, applyState, forget],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Autosave: debounced while typing (10s per spec §4-S1), immediate flush on blur. */
export function useAutosave(
  value: string,
  onSave: (v: string) => Promise<void> | void,
  delayMs = 10000,
) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const lastSaved = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = value !== lastSaved.current;

  const flush = useCallback(async () => {
    if (lastSaved.current === value) return;
    setStatus("saving");
    await onSave(value);
    lastSaved.current = value;
    setStatus("saved");
  }, [value, onSave]);

  useEffect(() => {
    if (!dirty) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, delayMs);
    return () => clearTimeout(timer.current);
  }, [dirty, delayMs, flush]);

  return { status, flush };
}
