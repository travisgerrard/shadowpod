/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  optimizeFonts: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    optimizeCss: false,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
  // Skip static generation for auth callback routes
  exportPathMap: async function (defaultPathMap) {
    const paths = { ...defaultPathMap };
    // Remove auth callback routes from static generation
    delete paths['/api/auth/mobile-callback'];
    delete paths['/auth/callback'];
    return paths;
  },
};

module.exports = nextConfig;
