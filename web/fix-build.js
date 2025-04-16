#!/usr/bin/env node

/**
 * This script prepares the web app for building by:
 * 1. Creating a clean src/shared directory with no mobile dependencies
 * 2. Creating minimal versions of shared files
 * 3. Cleaning up other problematic files that might cause stack overflow
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Preparing web app for Vercel build...');

try {
  // Create clean node_modules/.cache directory to ensure fresh build
  const cacheDir = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    console.log('Cleaning build cache...');
    execSync(`rm -rf ${cacheDir}`);
  }
  
  // Create/clean shared directory
  const sharedDir = path.join(__dirname, 'src', 'shared');
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  } else {
    // Remove all files in shared directory for a clean start
    const files = fs.readdirSync(sharedDir);
    for (const file of files) {
      fs.unlinkSync(path.join(sharedDir, file));
      console.log(`Removed ${file}`);
    }
  }
  
  // Create minimal types.ts
  console.log('Creating types.ts...');
  fs.writeFileSync(
    path.join(sharedDir, 'types.ts'),
    `// Essential shared types for web app
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
  
  // Create minimal session.ts
  console.log('Creating session.ts...');
  fs.writeFileSync(
    path.join(sharedDir, 'session.ts'),
    `// Simple session management for web
import { Session } from '@supabase/supabase-js';

export const syncSession = async (session: Session | null): Promise<void> => {
  // No-op implementation for web build
  console.log('Session sync called');
};

export const getStoredSession = async (): Promise<Session | null> => {
  return null;
};`
  );
  
  // Create index.ts
  console.log('Creating index.ts...');
  fs.writeFileSync(
    path.join(sharedDir, 'index.ts'),
    `// Shared exports
export * from './types';
export * from './session';`
  );
  
  // Create a touch file to mark this build as clean
  fs.writeFileSync(
    path.join(__dirname, '.clean-build'),
    `Build prepared at ${new Date().toISOString()}`
  );
  
  // Set an environment variable to help Next.js with its build
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  
  console.log('✅ Build preparation completed!');
  
} catch (error) {
  console.error('❌ Error preparing build:', error);
  process.exit(1);
} 