/**
 * Prefix a /public path with the deployment basePath.
 *
 * On GitHub Pages the site lives under /biolane-basket/, and next/image with
 * `unoptimized: true` uses the src verbatim — so "/images/x.png" would 404.
 * Locally (npm run dev) the prefix is empty and this is a no-op. A full
 * address (a biolane.ph product photo) is returned unchanged.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function asset(path: string): string {
  return /^https?:\/\//.test(path) ? path : BASE + path
}
