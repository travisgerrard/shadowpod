# Current Development Tasks

## Requirements
- Build an MVP with stories, shadowing, prompts, and review for web and mobile.
- Stories titled, ~50–100 characters, shadowing segments from story text.
- Toggleable translations for all content.
- Store modules for review by title, log encountered/difficult items.

## Tasks
1. **Setup Projects**:
   - [ ] Initialize Next.js app (`npx create-next-app@latest web --ts`).
   - [ ] Initialize Expo app (`npx create-expo-app mobile --template blank-typescript`).
   - [ ] Configure Supabase (tables, edge function).
2. **Authentication**:
   - [ ] Implement Supabase magic link auth (web + mobile).
3. **Vocab Handling**:
   - [ ] Fetch WaniKani learned items (API call, random selection).
   - [ ] Create local JSON vocab lists and dropdown UI.
4. **Content Generation**:
   - [ ] Write Supabase Edge Function for GPT-4o.
   - [ ] Store titled modules in `user_modules`.
5. **Learning Modules**:
   - [ ] Build Daily Story component (title, playback, toggle).
   - [ ] Implement Shadowing (story sentences, comparison).
   - [ ] Create Speaking Prompts component.
6. **Review Features**:
   - [ ] Add “Past Lessons” page/tab (fetch titled stories).
   - [ ] Build “Difficult Items” page/tab.
7. **Styling**:
   - [ ] Apply TailwindCSS with dark mode (`dark:` classes or `twrnc`).
8. **Testing**:
   - [ ] Test story length on mobile screens.
   - [ ] Verify shadowing segments match story.
9. **Deployment**:
   - [ ] Deploy web to Vercel.
   - [ ] Build mobile with Expo EAS.

## Next Steps
- Offline caching for modules.
- Enhanced audio feedback.