/** @type {import('next').NextConfig} */

// Hosted on Vercel (https://biolane-basket.vercel.app), which runs Next.js
// natively: the sign-up API route in app/api/submit runs on its server.
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Vercel resizes the packshots and serves them as AVIF/WebP — much
    // lighter on booth wifi than the original PNGs.
    formats: ['image/avif', 'image/webp'],
  },

  env: {
    // Served from the domain root. lib/asset.ts prefixes static paths with
    // this, so hosting under a sub-path later only needs this one value.
    NEXT_PUBLIC_BASE_PATH: '',
  },
}

export default nextConfig
