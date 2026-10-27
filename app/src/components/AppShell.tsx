import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useSession } from "../session";
import Nav from "./Nav";
import ProgressBar from "./ProgressBar";

/** Shell: left sidebar nav on desktop, top-bar drawer on mobile, progress on top. */
export default function AppShell() {
  const { ready, user } = useSession();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <p className="animate-pulse text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-screen bg-cream">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-teal-deep hover:bg-cream-deep md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display text-sm font-semibold text-plum sm:text-base">
            Sustained Inquiry · Pre-Session Prep
          </span>
          <ProgressBar />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6">
        {/* sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-x-4 top-16 z-20 rounded-xl border border-ink/10 bg-white p-3 shadow-xl md:static md:block md:w-64 md:shrink-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none no-print`}
        >
          <Nav onNavigate={() => setOpen(false)} />
        </aside>
        {open && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 bg-ink/20 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* section content */}
        <main className="min-w-0 flex-1 pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
