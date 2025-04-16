#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This script handles static export for Vercel
console.log('🚀 Preparing static export...');

try {
  // Set environment variables
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  // Make sure our shared directory is clean of any mobile files
  console.log('Cleaning shared directory...');
  
  // Copy shared types directly
  const sharedDir = path.join(__dirname, 'src', 'shared');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }
  
  // Simple inline content of types.ts to avoid path resolution issues
  const typesPath = path.join(sharedDir, 'types.ts');
  fs.writeFileSync(typesPath, `
// Shared types for both platforms
export interface StoryContent {
  id?: string;
  date?: string;
  title: string;
  content: string;
  translation: string;
  vocabulary: { japanese: string; english: string; reading?: string }[];
  grammar: { pattern: string; meaning: string; example?: string }[];
}

export interface ShadowingSegment {
  id?: string;
  text: string;
  translation: string;
  audioUrl?: string;
}

export interface SpeakingPrompt {
  id?: string;
  japanese: string;
  english: string;
  audioUrl?: string;
  hint?: string;
  response?: string;
}

export interface GeneratedContent {
  story: StoryContent;
  shadowing: ShadowingSegment[];
  speaking: SpeakingPrompt[];
  date?: string;
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  wanikani_api_key?: string;
  wanikani_level?: number;
  level?: string;
  settings?: {
    vocabCount?: number;
    grammarCount?: number;
    difficultyLevel?: string;
  };
  created_at?: string;
}

export type ModuleContent =
  | StoryContent
  | { shadowing: ShadowingSegment[] }
  | { speaking: SpeakingPrompt[] };

export interface UserModule {
  id?: string;
  user_id?: string;
  date: string;
  content: GeneratedContent;
  created_at?: string;
}

export interface VocabItem {
  japanese: string;
  english: string;
  reading?: string;
}

export interface GrammarItem {
  pattern: string;
  meaning: string;
  example?: string;
}
`);

  // Create session.ts with minimum needed functionality
  const sessionPath = path.join(sharedDir, 'session.ts');
  fs.writeFileSync(sessionPath, `
// Simplified session management - static version
export const syncSession = async (session: any | null) => {
  console.log('Session sync in static mode - no-op');
};

export const getStoredSession = async (): Promise<any | null> => {
  return null;
};
`);

  // Create index.ts
  const indexPath = path.join(sharedDir, 'index.ts');
  fs.writeFileSync(indexPath, `// Export shared functionality
export * from './types';
export * from './session';
`);

  console.log('✅ Shared files prepared');
  console.log('🏗️ Building static site...');
  
  // Run the static build command
  execSync('next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} 