/** @type {import('next').NextConfig} */

// Main host: Vercel (https://biolane-basket.vercel.app) — runs the sign-up
// API route in app/api/submit that saves to Supabase.
//
// Fallback: with GITHUB_PAGES=true this builds a static copy for
// carlgabriel1123.github.io/biolane-basket/. The workflow removes app/api
// first (a static site cannot run it), so that copy keeps sign-ups on the
// phone and re-sends them once they reach a server that can save them.
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const basePath = isGitHubPages ? '/biolane-basket' : ''

const nextConfig = {
  reactStrictMode: true,

  ...(isGitHubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath,
        assetPrefix: `${basePath}/`,
        images: { unoptimized: true },
      }
    : {
        // Vercel resizes the packshots and serves AVIF/WebP — lighter on
        // booth wifi than the original PNGs.
        images: { formats: ['image/avif', 'image/webp'] },
      }),

  env: {
    // lib/asset.ts and lib/submission.ts prefix paths with this.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

export default nextConfig
