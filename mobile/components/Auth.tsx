import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet, Platform } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

// Make sure to complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function Auth() {
  const [loading, setLoading] = useState(false);

  // Define the redirect handler outside useEffect so it can be called elsewhere
  const handleAuthRedirect = async (url: string | null) => {
      // Only process URLs that start with the correct scheme and have a fragment
      if (!url || !url.startsWith('shadowpod://auth/callback') || !url.includes('#')) {
        console.log('Ignoring irrelevant URL:', url);
        return;
      }
      console.log('Handling auth redirect URL:', url);

      try {
        // Supabase returns tokens in the URL fragment (#)
        const fragment = url.split('#')[1];
        if (!fragment) {
          console.log('No fragment found in URL');
          return;
        }
        
        // Parse the fragment as URL search params
        // Use a dummy base URL if needed for URLSearchParams, as it requires a full URL
        // However, Supabase tokens are usually in the fragment, so parsing directly might be safer
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        console.log('Tokens extracted from fragment:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });

        if (access_token && refresh_token) {
          console.log('Setting session with extracted tokens...');
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            Alert.alert('Error', `Failed to set session: ${error.message}`);
            return; // Stop execution if session setting fails
          }
          console.log('Successfully set session');
          // Redirect inside the app after successful session setting
          router.replace('/'); // Redirect to home or appropriate screen
        } else {
          console.log('Missing tokens in URL');
          Alert.alert('Error', 'Authentication incomplete - missing tokens');
        }
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        Alert.alert('Error', 'Failed to complete authentication');
      }
  };

  useEffect(() => {
    // Check initial URL when the component mounts
    Linking.getInitialURL().then(url => {
      if (url) {
        handleAuthRedirect(url);
      }
    });

    // Add deep link listener for links received while the app is open
    const subscription = Linking.addEventListener('url', (event) => handleAuthRedirect(event.url));

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Define the redirect URL using the custom scheme
      const redirectUrl = 'shadowpod://auth/callback';
      console.log('[Auth] Defined redirectUrl:', redirectUrl); // Added log

      console.log('[Auth] Calling signInWithOAuth with redirectTo:', redirectUrl); // Added log
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl, // Redirect directly back to the app
          skipBrowserRedirect: true, // Important for mobile OAuth
          // No queryParams needed here for return_to anymore
        }
      });

      if (error) throw error;

      if (data?.url) {
        console.log('[Auth] Received auth URL from Supabase:', data.url); // Modified log
        
        // Open the auth URL in the browser
        console.log('[Auth] Calling openAuthSessionAsync with redirectUrl:', redirectUrl); // Added log
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl, // Expect the session to end with the app's custom scheme URL
          {
            showInRecents: true,
            preferEphemeralSession: true,
            dismissButtonStyle: 'close',
          }
        );

        console.log('Auth result:', result);

        if (result.type === 'cancel') {
          Alert.alert('Login Cancelled', 'You cancelled the login process');
        } else if (result.type === 'success' && result.url) {
          console.log('Auth successful, processing redirect URL:', result.url);
          // Process the URL immediately instead of waiting for the Linking event
          await handleAuthRedirect(result.url);
        } else if (result.type === 'dismiss') {
          // Handle dismiss action if necessary, maybe just log it
          console.log('Auth session dismissed by user.');
        }
      }
    } catch (error: any) {
      console.error('Error with Google login:', error);
      Alert.alert('Error', error.message || 'An error occurred during Google sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[tw`flex-1 justify-center items-center bg-[#1a1f2e] px-6`, styles.container]}>
      <View style={tw`w-full max-w-[320px]`}>
        <View style={[tw`bg-[#242937] rounded-[32px] p-12`, styles.authContainer]}>
          <Text style={tw`text-4xl font-bold text-white mb-8 text-center`}>
            ShadowPod+
          </Text>
          <Text style={tw`text-xl text-gray-400 mb-16 text-center`}>
            Learn Japanese through{'\n'}
            personalized stories,{'\n'}
            shadowing,{'\n'}
            and speaking practice.
          </Text>

          <TouchableOpacity
            style={[
              tw`w-full flex-row justify-center items-center px-6 py-3.5 bg-white rounded-2xl`,
              loading && tw`opacity-50`,
              styles.button
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={tw`flex-row items-center justify-center w-full`}>
              {loading ? (
                <Text style={tw`text-base font-medium text-gray-700`}>
                  Connecting...
                </Text>
              ) : (
                <>
                  <Image
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={tw`w-5 h-5 mr-3`}
                  />
                  <Text style={tw`text-base font-medium text-gray-700`}>
                    Continue with Google
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={tw`mt-12`}>
          <Text style={tw`text-xl text-gray-400 text-center mb-4`}>
            Personalized content using your vocabulary level.
          </Text>
          <Text style={tw`text-xl text-gray-400 text-center`}>
            Practice speaking with AI-powered feedback.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }
}); 