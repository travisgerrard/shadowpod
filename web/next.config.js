/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove all experimental features causing issues
  experimental: {},
  // Simplify the webpack config
  webpack: (config) => {
    // Force exclusion of mobile-only code files
    config.module.rules.push({
      test: /\.native\.(js|ts|tsx)$/,
      use: 'ignore-loader'
    });
    
    return config;
  }
}

module.exports = nextConfig;
