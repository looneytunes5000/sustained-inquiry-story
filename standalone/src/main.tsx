/* Standalone entry for the published story.
 *
 * Renders the exact same Story screen as the training app. Only the two
 * app-only concerns are swapped out: nobody signs in, and progress lives in
 * localStorage instead of the PHP API. The manifest, reveal schedule, stages
 * and player are imported from the app source, so the two builds cannot drift.
 */
import { StrictMode, useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../app/src/styles.css";
import Story, { type StoryShell } from "../../app/src/sections/Story";

const KEY = "pbl:story_progress";

/** Standalone shell: no gate, browser-local progress. */
function StandaloneStory() {
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
    } catch {
      return {};
    }
  });

  const saveFurthest = useCallback((value: string) => {
    setResponses((prev) => {
      const next = { ...prev, "0": { ...prev["0"], story_furthest: value } };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Private mode or a full quota: the session still works in memory.
      }
      return next;
    });
  }, []);

  const shell: StoryShell = useMemo(
    () => ({
      ready: true,
      admitted: true,
      responses,
      saveFurthest,
      // Nothing to go back to on a standalone page; the header shows the
      // story title instead of an exit control.
      exit: () => {
        setResponses({});
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
        window.location.reload();
      },
      exitLabel: "Start over",
    }),
    [responses, saveFurthest],
  );

  return <Story shell={shell} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StandaloneStory />
  </StrictMode>,
);
