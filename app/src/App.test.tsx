import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import App from "./App";

// App boots SessionProvider which fetches config/state — stub fetch.
vi.stubGlobal(
  "fetch",
  vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: false }) })),
);

test("landing renders for a fresh visitor", async () => {
  render(<App />);
  const heading = await screen.findByRole("heading", { name: /sustained inquiry/i });
  expect(heading).toBeInTheDocument();
});
