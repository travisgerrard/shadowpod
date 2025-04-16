#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This script simulates what happens during a Vercel deployment locally
console.log('🚀 Testing Vercel deployment process locally...');

try {
  // Ensure we have the necessary environment variables
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  process.env.NEXT_RUNTIME = 'nodejs';
  
  // Ensure we have the right Next.js config
  console.log('Setting up simplified Next.js config...');
  fs.copyFileSync(
    path.join(__dirname, 'next.config.standalone.js'),
    path.join(__dirname, 'next.config.js')
  );
  
  // Run the standalone build
  console.log('Running standalone build...');
  execSync('npm run standalone', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 