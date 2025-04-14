# ShadowPod+ Usage Guide

## Prerequisites

To run ShadowPod+, you'll need the following:

1. **Node.js** (Version 18 or higher)
2. **npm** or **yarn** package manager
3. A **Supabase** account and project
4. An **OpenAI API key** for content generation
5. (Optional) A **WaniKani API key** if you want to use your WaniKani vocabulary

## Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in the `supabase/migrations` folder against your Supabase database
3. Deploy the Edge Functions in the `supabase/functions` folder
4. Get your Supabase URL and Anon Key from the project settings

### Environment Variables

1. **For the web app**: 
   - Create a `.env.local` file in the `web` directory
   - Copy the contents from `.env.example` and fill in your values

2. **For the mobile app**:
   - Create a `.env` file in the `mobile` directory with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

## Running the Web Application

1. Navigate to the web directory:
   ```
   cd web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Running the Mobile Application

1. Navigate to the mobile directory:
   ```
   cd mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Expo development server:
   ```
   npx expo start
   ```

4. Use the Expo Go app on your mobile device to scan the QR code, or press `i` for iOS simulator or `a` for Android emulator (if installed)

## Using the Application

1. **Sign Up/Sign In**:
   - Use the magic link authentication to sign up or sign in
   - Check your email for the login link

2. **Dashboard**:
   - View your daily story, shadowing practice, and speaking prompts
   - Toggle between the tabs to access different learning modules

3. **Level Selection**:
   - Choose to use WaniKani API (enter your token) or select a JLPT level

4. **Practice**:
   - **Story**: Read and listen to the daily story
   - **Shadowing**: Practice pronouncing sentences from the story
   - **Speaking**: Answer questions related to the story

5. **Review**:
   - Access past lessons from the "Past Lessons" section

## Deployment

### Web App Deployment

Deploy the web app to Vercel:

```
cd web
vercel deploy
```

### Mobile App Deployment

Build the mobile app with Expo EAS:

```
cd mobile
eas build --platform ios  # For iOS
eas build --platform android  # For Android
```

## Troubleshooting

- **Authentication Issues**: Make sure your Supabase URL and Anon Key are correct
- **Content Generation**: Verify your OpenAI API key is valid and has sufficient credits
- **WaniKani Integration**: Check that your WaniKani API token has the correct permissions 