/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable dependency collection entirely
  experimental: {
    // This setting completely disables dependency tracing
    turbotrace: false,
    // Opt out of Next.js' route handlers tracing
    serverComponentsExternalPackages: []
  },
  // Set to production-only to avoid tracing in development
  reactStrictMode: false,
  // Disable other optimizations that might cause issues
  optimizeFonts: false,
  swcMinify: false,
  // Simplest webpack config possible
  webpack: (config) => {
    // Add external module resolution fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };
    return config;
  }
}

module.exports = nextConfig;
