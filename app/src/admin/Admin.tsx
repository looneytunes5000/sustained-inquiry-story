import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, ListChecks, Search, Sparkles, Target, Users } from "lucide-react";
import { api, type AdminOverview, type AdminResponses } from "../api";
import { SECTIONS } from "../content";
import { useSession } from "../session";

const STORAGE_KEY = "pbl:admin";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "responses", label: "Responses" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Trainer dashboard on the secret /admin route. The password lives only in
 * api/config.php and (after sign-in) sessionStorage — never in the bundle.
 * Reads config via useSession: the Admin route sits outside AppShell, but
 * SessionProvider still loads GET /api/config.
 */
export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(() => !!sessionStorage.getItem(STORAGE_KEY));

  // The overview call doubles as the password check — 401 means wrong password.
  const verify = async () => {
    setError("");
    try {
      await api.admin.overview(password);
      sessionStorage.setItem(STORAGE_KEY, password);
      setVerified(true);
    } catch {
      setError("Incorrect password");
    }
  };

  if (!verified) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-6 py-12">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
          <div className="diag-cut bg-cream-deep px-8 pb-16 pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">Trainer access</p>
            <h1 className="mt-1 text-3xl font-semibold text-plum">Trainer dashboard</h1>
          </div>
          <form
            className="px-8 py-8"
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <p className="text-sm leading-relaxed text-ink-soft">
              This dashboard is for the trainer only. Enter the admin password to see trainee
              progress, quiz results, and every response before the live session.
            </p>
            <label
              htmlFor="admin-password"
              className="mb-1.5 mt-6 block text-sm font-semibold text-ink"
            >
              Admin password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-ink/15 px-4 py-2.5 text-[15px] transition-colors focus:border-teal focus:outline-none"
            />
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-maroon">
                Incorrect password
              </p>
            )}
            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-teal-deep px-4 py-2.5 font-semibold text-white transition-colors hover:bg-plum"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <Dashboard password={password} />;
}

function Dashboard({ password }: { password: string }) {
  const { config } = useSession();
  const [tab, setTab] = useState<TabId>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedNote, setSeedNote] = useState<{ text: string; bad?: boolean } | null>(null);

  const loadOverview = useCallback(async () => {
    setLoadError("");
    try {
      setOverview(await api.admin.overview(password));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load the overview.");
    }
  }, [password]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const runSeed = async () => {
    setSeeding(true);
    setSeedNote(null);
    try {
      const r = await api.admin.seed(password);
      setSeedNote({
        text:
          r.inserted > 0 ? `Seeded ${r.inserted} demo trainees.` : "Demo data already present.",
      });
      await loadOverview();
    } catch (e) {
      setSeedNote({
        text: e instanceof Error ? e.message : "Could not load demo data.",
        bad: true,
      });
    } finally {
      setSeeding(false);
    }
  };

  const users = overview?.users ?? [];
  const enrolled = users.length;
  const fullyComplete = users.filter((u) => u.completed_count >= 4).length;
  const fullyPct = enrolled > 0 ? Math.round((fullyComplete / enrolled) * 100) : 0;
  const quizWithData = (overview?.quiz ?? []).filter((q) => q.total > 0);
  const avgPct =
    quizWithData.length > 0
      ? Math.round(quizWithData.reduce((sum, q) => sum + q.pct, 0) / quizWithData.length)
      : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">Trainer only</p>
        <h1 className="mt-1 text-3xl font-semibold text-plum sm:text-4xl">Trainer dashboard</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          See who has completed the prep, how the cohort did on the self-check quiz, and read
          every response before the live session.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Dashboard views"
        className="mt-8 inline-flex gap-1 rounded-xl bg-cream-deep p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-white text-plum shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          className="mt-6"
        >
          {loadError && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-maroon/30 bg-white px-4 py-3 text-sm text-maroon"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {config?.seed_enabled && (
            <div>
              <button
                type="button"
                onClick={() => void runSeed()}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-xl bg-plum px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-maroon disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={16} aria-hidden={true} />
                {seeding ? "Loading demo data…" : "Load demo data"}
              </button>
              {seedNote && (
                <p
                  role="status"
                  className={`mt-2 text-sm font-medium ${seedNote.bad ? "text-maroon" : "text-moss"}`}
                >
                  {seedNote.text}
                </p>
              )}
            </div>
          )}

          {overview === null ? (
            !loadError && <p className="mt-6 text-sm text-ink-soft">Loading overview…</p>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <StatTile
                  label="Enrolled"
                  value={String(enrolled)}
                  sub="trainees registered"
                  icon={<Users size={20} aria-hidden={true} />}
                />
                <StatTile
                  label="Fully complete"
                  value={String(fullyComplete)}
                  sub={`${fullyPct}% of enrolled finished all 4 sections`}
                  icon={<ListChecks size={20} aria-hidden={true} />}
                />
                <StatTile
                  label="Avg first-attempt score"
                  value={avgPct === null ? "—" : `${avgPct}%`}
                  sub={avgPct === null ? "no quiz attempts yet" : "mean of Q1–Q3 results"}
                  icon={<Target size={20} aria-hidden={true} />}
                />
              </div>

              <section aria-labelledby="tracker-title" className="mt-10">
                <h2 id="tracker-title" className="text-xl font-semibold text-plum">
                  Completion tracker
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Required sections completed per trainee — 4 of 4 unlocks the session summary.
                </p>
                {users.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-ink/10 bg-white px-4 py-6 text-sm text-ink-soft">
                    No trainees yet — share the prep link with your cohort.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          <th scope="col" className="px-4 py-3">Name</th>
                          <th scope="col" className="px-4 py-3">Email</th>
                          <th scope="col" className="px-4 py-3">Subject</th>
                          <th scope="col" className="px-4 py-3">Sections</th>
                          <th scope="col" className="px-4 py-3">Last active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u.email}
                            className="border-b border-ink/5 last:border-0 hover:bg-cream/60"
                          >
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                              {u.name}
                            </td>
                            <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                              {u.subject_area || "—"}
                            </td>
                            <td
                              className={`whitespace-nowrap px-4 py-3 font-semibold ${
                                u.completed_count >= 4 ? "text-moss" : "text-ink"
                              }`}
                            >
                              {u.completed_count} / 4
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                              {formatDateTime(u.last_active_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section aria-labelledby="quiz-title" className="mt-10">
                <h2 id="quiz-title" className="text-xl font-semibold text-plum">
                  Self-check quiz results
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Share of trainees who answered each question correctly on their first attempt.
                </p>
                {quizWithData.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-ink/10 bg-white px-4 py-6 text-sm text-ink-soft">
                    No quiz attempts yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-5 rounded-2xl border border-ink/10 bg-white p-5">
                    {quizWithData.map((q) => (
                      <div key={q.question_id}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                          <span className="font-semibold text-ink">Question {q.question_id}</span>
                          <span className="text-ink-soft">
                            {q.pct}% first-attempt correct · {q.correct}/{q.total}
                          </span>
                        </div>
                        <div
                          role="img"
                          aria-label={`Q${q.question_id}: ${q.pct}% first-attempt correct`}
                          className="h-3 overflow-hidden rounded-full bg-cream-deep"
                        >
                          <div
                            className="h-full rounded-full bg-teal transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, q.pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-responses"
          aria-labelledby="tab-responses"
          className="mt-6"
        >
          <ResponsesTab password={password} />
        </div>
      )}
    </main>
  );
}

function ResponsesTab({ password }: { password: string }) {
  const [rows, setRows] = useState<AdminResponses["rows"]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [subject, setSubject] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    setLoaded(false);
    setLoadError("");
    api.admin
      .responses(password)
      .then((d) => {
        if (live) {
          setRows(d.rows);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (live) setLoadError(e instanceof Error ? e.message : "Could not load responses.");
      });
    return () => {
      live = false;
    };
  }, [password]);

  const subjects = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.subject_area).filter((s) => s !== ""))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );

  const needle = query.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (subject !== "all" && r.subject_area !== subject) return false;
    if (!needle) return true;
    return [r.name, r.email, r.value].some((v) => v.toLowerCase().includes(needle));
  });

  return (
    <section aria-labelledby="responses-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="responses-title" className="text-xl font-semibold text-plum">
            Responses
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Every saved answer, ready to bring to the live session.
          </p>
        </div>
        <a
          href={api.admin.exportUrl(password)}
          download="pbl-prep-responses.csv"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-teal px-4 py-2 text-sm font-semibold text-teal-deep transition-colors hover:bg-teal hover:text-white"
        >
          <Download size={16} aria-hidden={true} /> Export CSV
        </a>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-72">
          <label
            htmlFor="responses-search"
            className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-soft"
          >
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden={true}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              id="responses-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, or response text"
              className="w-full rounded-xl border-2 border-ink/15 bg-white py-2 pl-9 pr-3 text-sm transition-colors focus:border-teal focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="responses-subject"
            className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-soft"
          >
            Subject
          </label>
          <select
            id="responses-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border-2 border-ink/15 bg-white px-3 py-2 text-sm transition-colors focus:border-teal focus:outline-none sm:w-auto"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {loaded && rows.length > 0 && (
          <p className="text-sm text-ink-soft sm:ml-auto">
            Showing {filtered.length} of {rows.length} responses
          </p>
        )}
      </div>

      {loadError ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-maroon/30 bg-white px-4 py-6 text-sm text-maroon"
        >
          {loadError}
        </p>
      ) : !loaded ? (
        <p className="mt-4 text-sm text-ink-soft">Loading responses…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-ink/10 bg-white px-4 py-6 text-sm text-ink-soft">
          No responses yet — they appear here as trainees work through the prep.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-ink/10 bg-white px-4 py-6 text-sm text-ink-soft">
          No responses match the current search or subject filter.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Subject</th>
                <th scope="col" className="px-4 py-3">Section</th>
                <th scope="col" className="px-4 py-3">Field</th>
                <th scope="col" className="px-4 py-3">Response</th>
                <th scope="col" className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={`${r.email}-${r.section_id}-${r.field_name}`}
                  className="border-b border-ink/5 align-top last:border-0 hover:bg-cream/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{r.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {r.subject_area || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {`S${r.section_id} · ${sectionTitle(r.section_id)}`}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cream-deep px-1.5 py-0.5 text-xs text-plum">
                      {r.field_name}
                    </code>
                  </td>
                  <td className="max-w-xs whitespace-pre-wrap break-words px-4 py-3 text-ink">
                    {r.value || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {formatDateTime(r.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{label}</p>
        <span className="text-teal" aria-hidden={true}>
          {icon}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-plum">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{sub}</p>
    </div>
  );
}

/** DB timestamps are UTC ("YYYY-MM-DD HH:MM:SS"); show them in local time. */
function formatDateTime(value: string): string {
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(withZone);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sectionTitle(id: number): string {
  return SECTIONS.find((s) => s.id === id)?.title ?? `Section ${id}`;
}
