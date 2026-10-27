/* Media URLs.

   In the training app everything is served from the site root, so the manifest
   can hold plain paths like "/story/scene-01.jpg". The standalone build is
   published under a sub-path (GitHub Pages project sites live at
   /<repo>/), where a leading slash would point outside the site. Folding the
   Vite base in here keeps the manifest readable and lets both builds share it.

   BASE_URL is "/" for the app and for tests, which must stay a no-op. */
export function assetUrl(path: string): string {
  // Vite injects BASE_URL; it is absent under plain Node/vitest.
  const base =
    (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
  if (base === "/" || base === "") return path;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}${path.startsWith("/") ? path : `/${path}`}`;
}
