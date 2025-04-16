#!/usr/bin/env node

/**
 * This script creates an isolated build environment with all needed types
 * directly inside the web project, eliminating any need for dependency scanning
 * outside the web directory.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Creating isolated build environment...');

try {
  // Clean build cache
  try {
    execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
    execSync('rm -rf .next', { stdio: 'inherit' });
  } catch (e) {
    console.log('Cache cleanup failed, but continuing...');
  }
  
  // Create shared directory if it doesn't exist
  const sharedDir = path.join(__dirname, 'src', 'shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  
  // Remove any existing files
  try {
    const files = fs.readdirSync(sharedDir);
    for (const file of files) {
      fs.unlinkSync(path.join(sharedDir, file));
    }
  } catch (e) {
    console.log('No files to clean in shared directory');
  }
  
  // Write minimal types.ts
  fs.writeFileSync(
    path.join(sharedDir, 'types.ts'),
    `// Essential types for web app
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
  wanikani_api_token?: string | null;
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
}`
  );
  
  // Write minimal session.ts
  fs.writeFileSync(
    path.join(sharedDir, 'session.ts'),
    `// Minimal session handling for web
import { Session } from '@supabase/supabase-js';

export const syncSession = async (session: Session | null): Promise<void> => {
  console.log('Session sync called');
};

export const getStoredSession = async (): Promise<Session | null> => {
  return null;
};`
  );
  
  // Write index.ts
  fs.writeFileSync(
    path.join(sharedDir, 'index.ts'),
    `// Exports
export * from './types';
export * from './session';`
  );
  
  // Create a marker file to show we've done the setup
  fs.writeFileSync(
    path.join(__dirname, '.isolated-build'),
    `Build prepared at ${new Date().toISOString()}`
  );
  
  // Set environment variables
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096 --no-warnings';
  process.env.NEXT_DISABLE_SOURCEMAPS = '1';
  
  console.log('✅ Build environment prepared successfully');
  
} catch (error) {
  console.error('❌ Error preparing build environment:', error);
  process.exit(1);
} 