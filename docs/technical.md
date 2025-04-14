# Technical Specifications

## Frontend (Web - React + Next.js)
- **Framework**: React, Next.js App Router.
- **Styling**: TailwindCSS (`dark:` for dark mode).
- **Modules**:
  - **Daily Story**: Titled story (~50–100 chars), playback (Web Audio API), translation toggle.
  - **Shadowing**: Sentences from story, recording (Web Speech API), text comparison.
  - **Speaking Prompts**: Questions with answers, translation toggles.
  - **Review**: “Past Lessons” (titled stories) and “Difficult Items” pages.
- **API Routes**: `/app/api/generate` for Supabase calls.
- **Types**: TypeScript interfaces (e.g., `interface Story { title: { japanese: string; english: string }; japanese: string; english: string }`).

## Frontend (Mobile - React Native + Expo)
- **Framework**: React Native, Expo.
- **Styling**: TailwindCSS via `twrnc` (dark mode support).
- **Modules**: Same as web, adapted:
  - Playback: Expo AV.
  - Recording/Comparison: Expo Speech-to-Text.
- **Navigation**: Expo Router (`app/` directory).
- **Types**: Shared TypeScript interfaces with web.

## Vocab Handling
- **WaniKani**: Fetch learned items (`/v2/assignments`, filter `passed_at`/`burned_at`), random 3–5 items.
- **Fallback**: Dropdown (N5, N4, etc.), local JSON lists, random 3–5 items.

## Backend (Supabase)
- **Tables**:
  - `user_profiles`:
    - `wanikani_api_token` (string, nullable).
    - `selected_wanikani_level` (string, e.g., "N5").
    - `encountered_items` (JSONB, e.g., `[{"vocab": "友達", "timestamp": "2025-04-09"}]`.
    - `difficult_items` (JSONB, e.g., `[{"vocab": "犬", "reason": "pronunciation"}]`.
  - `user_modules`:
    - `id` (UUID).
    - `user_id` (foreign key).
    - `module_type` (enum: "story", "shadowing", "prompt").
    - `content` (JSONB, e.g., `{"title": {"japanese": "友達と公園"}, "japanese": "..."}`).
    - `created_at` (timestamp).
- **Edge Function**:
  - Input: `{"vocab": ["友達", "犬"], "grammar": ["〜ました"], "wanikaniLevel": "N5"}`.
  - Prompt: “Using GPT-4o, generate a titled story (~50–100 chars) with translations, shadowing segments from the story, and a prompt.”
  - Output: JSON (see example).

## Example Output
```json
{
  "story": {
    "title": {"japanese": "友達と公園", "english": "Friends and the Park"},
    "japanese": "昨日、山田さんは友達と公園に行きました。公園はとても広かったです。友達は犬を見ました。",
    "english": "Yesterday, Yamada-san went to the park with a friend. The park was very spacious. The friend saw a dog."
  },
  "shadowingSegments": [
    {"japanese": "昨日、山田さんは友達と公園に行きました。", "english": "..."}
  ],
  "speakingPrompts": [
    {"question": {"japanese": "山田さんは何をした？", "english": "..."}, "modelAnswer": {...}}
  ]
}