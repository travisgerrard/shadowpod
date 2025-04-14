/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  optimizeFonts: true,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

module.exports = nextConfig;
