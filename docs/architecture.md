# System Architecture

## Overview
ShadowPod+ uses a client-server architecture with React (Next.js) for web and React Native (Expo) for mobile as frontends, and Supabase as the backend. It integrates WaniKani and OpenAI GPT-4o APIs for content generation and stores data for review.

## Components

### Frontend (Web - React + Next.js)
- **UI Layer**: React components styled with TailwindCSS (dark mode via `dark:` prefix).
- **Data Layer**: Fetches vocab via API routes or local JSON.
- **Audio Layer**: Web Audio API (playback), Web Speech API (recording, text comparison).
- **Routing**: Next.js App Router (`app/` directory) for pages and API endpoints.

### Frontend (Mobile - React Native + Expo)
- **UI Layer**: React Native components with TailwindCSS (via `twrnc`).
- **Data Layer**: Same as web, adapted for mobile.
- **Audio Layer**: Expo AV (playback), Expo Speech-to-Text (recording, comparison).
- **Navigation**: Expo Router for mobile navigation.

### Backend (Supabase)
- **Authentication**: Magic link auth.
- **Database**: 
  - `user_profiles`: User settings, encountered/difficult items.
  - `user_modules`: Generated content (titled stories, shadowing, prompts).
- **Edge Functions**: GPT-4o content generation.

### External APIs
- **WaniKani API**: Learned vocab/grammar for linked users.
- **OpenAI GPT-4o**: Titled stories, shadowing segments, prompts with translations.

## Component Relationships
1. **User Input**: Frontend collects WaniKani token or level selection.
2. **Vocab Fetch**: Client calls WaniKani API or uses local JSON.
3. **Content Generation**: Frontend → Supabase Edge Function → GPT-4o → stored in `user_modules`.
4. **Display**: Frontend renders modules with playback and translation toggles.
5. **Review**: Frontend fetches titled modules from Supabase.

## Data Flow
- **Input**: Vocab/grammar → Edge Function.
- **Output**: Titled story (~50–100 chars), shadowing segments (from story), prompts → stored and displayed.
- **Feedback**: Encountered items logged, difficult items flagged.