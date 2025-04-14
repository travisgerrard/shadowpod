# ShadowPod+ Mobile App

A React Native app using Expo for learning Japanese vocabulary and grammar through personalized content.

## Features

- Daily titled stories with playback and toggleable translations
- Shadowing practice with speech recognition
- Speaking prompts with model answers
- WaniKani API integration or manual JLPT level selection
- Review of past lessons

## Setup

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Create `.env` file** with the following variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Run the development server**:
   ```
   npx expo start
   ```
   
4. **Testing on a device**:
   - Install the Expo Go app on your iOS or Android device
   - Scan the QR code in your terminal with the Expo Go app
   - Or run on simulators with `npx expo run:ios` or `npx expo run:android`

## Development and Deployment

- **Building for production**:
  ```
  eas build --platform ios
  eas build --platform android
  ```

- **Submitting to app stores**:
  ```
  eas submit -p ios
  eas submit -p android
  ```

Refer to the root README.md for more information about the ShadowPod+ project. 