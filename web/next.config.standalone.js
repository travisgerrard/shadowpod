/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Create a standalone build
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors during builds
  },
  experimental: {
    // Disable features that might cause issues
    optimizePackageImports: [],
    optimizeCss: false,
    instrumentationHook: false,
    serverComponentsExternalPackages: [],
  },
  webpack: (config) => {
    // Simplify config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 