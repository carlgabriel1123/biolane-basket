/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // All product art is self-hosted under /public/images/products,
    // so no remote patterns are needed. Keeps the booth build offline-safe.
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
