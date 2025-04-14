module.exports = {
  expo: {
    name: 'ShadowPod+',
    slug: 'shadowpod',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.shadowpod.app',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['shadowpod'],
            CFBundleURLName: 'com.shadowpod.app'
          }
        ],
        NSMicrophoneUsageDescription: 'This app needs access to your microphone for speech recognition.',
        NSMicrophoneUsageDescription: 'This app needs access to your microphone for voice recording.',
        NSMicrophoneUsageDescription: 'This app needs access to your microphone for on-device speech recognition.'
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.shadowpod.app',
      permissions: ['RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS'],
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: 'shadowpod' }],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone for speech recognition.'
        }
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1'
          }
        }
      ]
    ],
    scheme: 'shadowpod',
    experiments: {
      tsconfigPaths: true
    },
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      router: {
        origin: false
      },
      eas: {
        projectId: "84460405-9771-44a4-a2f3-db900d35fc3e"
      }
    },
    newArchEnabled: true
  }
}; 