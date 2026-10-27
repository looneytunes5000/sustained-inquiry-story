/* Typed client for the PHP API. Every endpoint returns {ok:true,...} or
   throws Error(message) on !ok / non-2xx. */

export interface TraineeState {
  user: { name: string; email: string; subject_area: string };
  progress: Record<string, { started: boolean; completed: boolean }>;
  responses: Record<string, Record<string, string>>;
  quiz: Record<string, { selected_option: string; is_correct: boolean; attempts: number }>;
}

export interface AppConfig {
  session: { title: string; date: string; time: string; venue: string; deadline: string };
  /* The whole video block comes through api/config.php (api/index.php passes it
     verbatim): flipping enabled swaps S1's written scenarios for the real clip
     without touching the SPA. */
  video: {
    enabled: boolean;
    url?: string;
    captions_url?: string;
  };
  seed_enabled: boolean;
}

export interface AdminOverview {
  ok: true;
  users: {
    name: string;
    email: string;
    subject_area: string;
    completed_count: number;
    last_active_at: string;
  }[];
  quiz: { question_id: number; total: number; correct: number; pct: number }[];
}

export interface AdminResponses {
  ok: true;
  rows: {
    name: string;
    email: string;
    subject_area: string;
    section_id: number;
    field_name: string;
    value: string;
    updated_at: string;
  }[];
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

async function adminCall<T>(path: string, password: string, init?: RequestInit): Promise<T> {
  return call<T>(path, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Admin-Password": password },
  });
}

export const api = {
  config: () => call<{ ok: true; config: AppConfig }>("/config").then((d) => d.config),

  entry: (name: string, email: string, subject_area: string) =>
    call<{ ok: true; state: TraineeState }>("/entry", {
      method: "POST",
      body: JSON.stringify({ name, email, subject_area }),
    }).then((d) => d.state),

  state: (email: string) =>
    call<{ ok: true; state: TraineeState }>(`/state?email=${encodeURIComponent(email)}`).then(
      (d) => d.state,
    ),

  response: (email: string, section_id: number, field_name: string, value: string) =>
    call<{ ok: true }>("/response", {
      method: "PUT",
      body: JSON.stringify({ email, section_id, field_name, value }),
    }),

  progress: (email: string, section_id: number, event: "started" | "completed") =>
    call<{ ok: true }>("/progress", {
      method: "POST",
      body: JSON.stringify({ email, section_id, event }),
    }),

  quiz: (email: string, question_id: number, selected_option: string, is_correct: boolean) =>
    call<{ ok: true }>("/quiz", {
      method: "POST",
      body: JSON.stringify({ email, question_id, selected_option, is_correct }),
    }),

  admin: {
    overview: (password: string) => adminCall<AdminOverview>("/admin/overview", password),
    responses: (password: string) => adminCall<AdminResponses>("/admin/responses", password),
    seed: (password: string) =>
      adminCall<{ ok: true; inserted: number }>("/admin/seed", password, { method: "POST" }),
    exportUrl: (password: string) => `/api/admin/export.csv?p=${encodeURIComponent(password)}`,
  },
};
