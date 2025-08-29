/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure vendor chunks are emitted for transitive deps used on the server
  serverExternalPackages: ["tr46", "whatwg-url"],
}

export default nextConfig
