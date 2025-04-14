# ShadowPod

A mobile application for practicing Japanese language through shadowing exercises, featuring real-time speech recognition and pronunciation feedback.

## Features

- Japanese text-to-speech with adjustable playback speed
- Real-time speech recognition using OpenAI's Whisper API
- Detailed pronunciation feedback with accuracy scoring
- Word-level comparison between target and spoken text
- Japanese language feedback messages
- Progress tracking through Supabase backend

## Tech Stack

- React Native with Expo
- TypeScript
- OpenAI Whisper API for speech recognition
- Supabase for backend and authentication
- Expo Speech for text-to-speech
- Expo AV for audio recording

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/travisgerrard/shadowpod.git
   cd shadowpod/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase and OpenAI API credentials

4. Start the development server:
   ```bash
   npx expo start
   ```

### Environment Variables

Create a `.env` file in the `mobile` directory with the following variables:

```plaintext
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
mobile/
├── app/              # Expo Router app directory
├── components/       # React components
├── lib/             # Utility functions and API clients
├── assets/          # Static assets
└── types/           # TypeScript type definitions
```

## Features in Detail

### Shadowing Practice
- Play Japanese audio segments
- Record your pronunciation
- Get real-time feedback
- View detailed comparison with the target text
- Track progress over time

### Speech Recognition
- Uses OpenAI's Whisper API for accurate Japanese speech recognition
- Handles both short and long utterances
- Provides real-time transcription

### Pronunciation Feedback
- Overall accuracy score
- Word-level comparison
- Missing/extra word detection
- Encouraging feedback in Japanese

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the Whisper API
- Supabase for the backend infrastructure
- Expo team for the excellent mobile development framework