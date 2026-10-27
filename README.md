# Sustained Inquiry — The Story

A visual story for project-based learning. One class, one driving question, and
the questions they learn to ask across four stages: **Driving Question → QFT →
Gather → Critique & Revision**.

Published site: <https://looneytunes5000.github.io/sustained-inquiry-story/>

## What this repo is

The story is a standalone web page: no login, no backend. Progress is stored in
the browser's `localStorage`, so a viewer can leave and resume on the same
device. It is built from the same React components as the training webapp it
came from, which is why `app/src` is present — `standalone/` imports the story
screens and content from it rather than keeping a second copy.

## Run it locally

```bash
npm ci --prefix app
npm ci --prefix standalone
npm run dev --prefix standalone
```

The dev server runs on <http://localhost:5174>.

## Build

```bash
npm run build --prefix standalone
```

Output goes to `standalone/dist`. Under GitHub Pages the site is served from a
sub-path, so the build sets Vite's `base` to the repository name. Override it
for other hosts:

```bash
STORY_BASE=/ npm run build --prefix standalone
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy-story.yml`, which builds the
standalone package and publishes it to GitHub Pages.

## Editing the story

All content lives in `app/src/data/story-manifest.ts`: scene titles, media
paths, the question trail, which questions appear at which scene, and the end
card. The reveal schedule is plain data, and `app/src/data/story.test.ts`
checks that each answer lands in the scene that earns it.

Media lives in `app/public/story/` as `scene-01.jpg` … `scene-15.jpg` and their
matching `scene-NN.mp3`. Scene 4 has two panels (`scene-04a`, `scene-04b`) that
cross-fade partway through its narration.
