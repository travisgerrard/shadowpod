/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable any experimental features
  experimental: {},
  // Skip dependency tracing for files matching these patterns
  transpilePackages: [],
  // Disable unnecessary optimizations
  optimizeFonts: false,
  // Simplify webpack config to prevent stack overflow
  webpack: (config) => {
    // Only essential rule to exclude mobile files
    config.module.rules.push({
      test: /\.native\.(js|ts|tsx)$/,
      use: 'ignore-loader'
    });
    return config;
  }
}

module.exports = nextConfig;
