import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/*
 * Standalone story build.
 *
 * Its own root (standalone/) so the published site is just the story — no
 * training app, no admin route. The source it needs lives in ../app/src, which
 * sits outside this root, so the dev server is allowed to read one level up.
 *
 * `base` must match the GitHub Pages project path: a project site is served
 * from /<repo>/, and a root-absolute asset path would 404 there. Override with
 * STORY_BASE when publishing under a different path.
 */
const base = process.env.STORY_BASE ?? "/sustained-inquiry-story/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  publicDir: "../app/public",
  server: {
    port: 5174,
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
