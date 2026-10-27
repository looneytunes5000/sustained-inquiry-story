import { useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CheckBadge from "../components/CheckBadge";
import ProgressBar from "../components/ProgressBar";
import {
  DISCIPLINES,
  LANDING,
  REQUIRED_SECTIONS,
  SECTIONS,
  type SectionId,
} from "../content";
import { useSession } from "../session";

/** Route of the first incomplete required section (REQUIRED_SECTIONS order),
 *  or /done once every required section is complete. */
function firstIncompleteRoute(isComplete: (id: SectionId) => boolean): string {
  for (const id of REQUIRED_SECTIONS) {
    const section = SECTIONS.find((s) => s.id === id);
    if (section && !isComplete(id)) return section.route;
  }
  return "/done";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
}

/** Label + control + inline error/hint slot for one entry-form field. */
function EntryField({
  id,
  label,
  required = false,
  optional = false,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-plum">
            *
          </span>
        )}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-ink-soft">(optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-maroon">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
    </div>
  );
}

/** S0 — landing: session intro, entry form (name / email / subject area), resume. */
export default function Landing() {
  const { ready, user, config, enter, forget, isComplete } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // enter() resolves before the provider's fresh progress has re-rendered, so
  // navigation waits for a layout effect that sees the new isComplete state.
  const [awaitingNav, setAwaitingNav] = useState(false);

  useLayoutEffect(() => {
    if (awaitingNav && user) {
      setAwaitingNav(false);
      navigate(firstIncompleteRoute(isComplete));
    }
  }, [awaitingNav, user, isComplete, navigate]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream">
        <span
          role="status"
          aria-label="Loading"
          className="size-10 animate-spin rounded-full border-[3px] border-teal border-t-transparent"
        />
      </main>
    );
  }

  const firstName = user ? user.name.trim().split(/\s+/)[0] : "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    const mail = email.trim();
    if (!mail) next.email = "Please enter your email.";
    else if (!EMAIL_RE.test(mail)) next.email = "Please enter a valid email address.";
    setErrors(next);
    setServerError(null);
    if (next.name || next.email) return;
    setBusy(true);
    setAwaitingNav(true);
    enter(name.trim(), mail, subject.trim())
      .catch(() => {
        setAwaitingNav(false);
        setServerError(
          "We couldn't reach the server. Check your connection and try again.",
        );
      })
      .finally(() => setBusy(false));
  };

  // Placeholder ≥4.5:1 on white (WCAG AA): ink #23242b at 70% alpha blends to
  // ~#65666B ≈ 5.7:1. (Lower alphas like /30 ≈ 1.9:1 or /55 ≈ 3.6:1 fail.)
  const inputClass = (invalid: boolean) =>
    `w-full rounded-xl border-2 bg-white px-4 py-2.5 text-[15px] transition-colors placeholder:text-ink/70 focus:outline-none ${
      invalid ? "border-orange" : "border-ink/15 focus:border-teal"
    }`;

  return (
    <main className="min-h-screen bg-cream">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-3">
        {/* Left — kicker, title, intro, entry/resume */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="col-span-1 flex flex-col justify-center px-6 py-14 sm:px-12 lg:col-span-2 lg:px-16 xl:px-24"
        >
          <span className="inline-flex w-fit items-center rounded-full bg-teal-deep px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white">
            PBL · CLT VTC
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.05] text-plum sm:text-6xl xl:text-7xl">
            {LANDING.title}
          </h1>
          <span aria-hidden="true" className="mt-6 block h-1.5 w-24 rounded-full bg-teal" />
          <p className="mt-5 max-w-xl text-lg text-ink-soft sm:text-xl">
            {config
              ? `Complete this before ${config.session.deadline} — ${LANDING.timeEstimate}`
              : LANDING.timeEstimate}
          </p>
          <p className="mt-6 max-w-xl leading-relaxed text-ink">{LANDING.intro}</p>

          {user ? (
            /* ---- Returning user: resume card ---- */
            <section
              aria-label="Resume"
              className="mt-10 max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-display text-2xl text-plum">Welcome back, {firstName}</h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                Your answers are saved automatically — pick up right where you left off.
              </p>
              <div className="mt-5">
                <ProgressBar />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button
                  type="button"
                  onClick={() => navigate(firstIncompleteRoute(isComplete))}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-deep px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-deep/90"
                >
                  Continue <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={forget}
                  className="text-sm font-medium text-ink-soft underline decoration-ink/30 underline-offset-4 transition-colors hover:text-plum"
                >
                  Not you?
                </button>
              </div>
            </section>
          ) : (
            /* ---- Fresh visitor: entry form ---- */
            <form
              onSubmit={handleSubmit}
              noValidate={true}
              className="mt-10 max-w-xl rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-display text-2xl text-plum">Start the pre-work</h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                No password needed — the same email resumes your progress.
              </p>

              <div className="mt-6 grid gap-5">
                <EntryField id="entry-name" label="Name" required={true} error={errors.name}>
                  <input
                    id="entry-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="e.g. Alex Chan"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "entry-name-error" : undefined}
                    className={inputClass(!!errors.name)}
                  />
                </EntryField>

                <EntryField id="entry-email" label="Email" required={true} error={errors.email}>
                  <input
                    id="entry-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="e.g. alex@school.edu.hk"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "entry-email-error" : undefined}
                    className={inputClass(!!errors.email)}
                  />
                </EntryField>

                <EntryField
                  id="entry-subject"
                  label="Subject area"
                  optional={true}
                  hint="Used to tailor the examples you'll see — pick a discipline or type your own."
                >
                  <input
                    id="entry-subject"
                    type="text"
                    list="entry-disciplines"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Engineering"
                    className={inputClass(false)}
                  />
                  <datalist id="entry-disciplines">
                    {DISCIPLINES.map((d) => (
                      <option key={d.id} value={d.label} />
                    ))}
                  </datalist>
                </EntryField>
              </div>

              {serverError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-maroon/20 bg-blush/60 px-4 py-3 text-sm font-medium text-maroon"
                >
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal-deep px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-deep/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Starting…" : "Start"}
                {!busy && <ArrowRight size={18} aria-hidden="true" />}
              </button>
            </form>
          )}

          {user ? (
            <section
              aria-label="The Story"
              className="mt-6 max-w-xl rounded-2xl border border-note-edge bg-note p-6 shadow-sm sm:p-8"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-deep">
                Optional · 2 minutes
              </p>
              <h2 className="mt-2 font-display text-2xl text-plum">
                Would you let your brother swim there?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                Watch a class work one big question through six scenes — and watch their
                questions change as they go.
              </p>
              <button
                type="button"
                onClick={() => navigate("/story")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-deep px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-deep/90"
              >
                Open the story <ArrowRight size={16} aria-hidden="true" />
              </button>
            </section>
          ) : null}
        </motion.div>

        {/* Right third — cream-deep diagonal panel with the check-badge motif */}
        <motion.aside
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div className="diag-cut absolute inset-0 border-l border-teal/25 bg-cream-deep" />
          <span className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-teal/15" />
          <div className="relative flex h-full flex-col items-center justify-center gap-8 pb-24">
            <span className="grid place-items-center rounded-full bg-white/70 p-6 shadow-sm ring-1 ring-ink/5">
              <CheckBadge done={true} size={72} />
            </span>
            <span className="h-8 border-l-2 border-dashed border-teal/40" />
            <div className="flex items-center gap-3">
              {REQUIRED_SECTIONS.map((id) => (
                <CheckBadge key={id} done={false} size={24} />
              ))}
            </div>
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-teal-deep">
              {REQUIRED_SECTIONS.length} sections · {LANDING.timeEstimate}
            </p>
          </div>
        </motion.aside>
      </div>
    </main>
  );
}
