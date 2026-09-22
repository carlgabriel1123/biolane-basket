/** @type {import('next').NextConfig} */

// Served from https://carlgabriel1123.github.io/biolane-basket/
// Change this if the repo is renamed.
const repoName = 'biolane-basket'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  reactStrictMode: true,

  // Static HTML export — no Node server needed, hosts on GitHub Pages.
  output: 'export',
  trailingSlash: true,

  // GitHub Pages serves project sites from a sub-path.
  basePath: isGitHubPages ? `/${repoName}` : '',
  assetPrefix: isGitHubPages ? `/${repoName}/` : '',

  images: {
    // Image optimisation needs a server; the packshots are already resized
    // to 600px at the source, so we serve them as-is.
    unoptimized: true,
  },

  // Unoptimised <Image> does NOT prepend basePath itself, so lib/asset.ts
  // reads this and does it for every static file we reference.
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? `/${repoName}` : '',
  },
}

export default nextConfig
