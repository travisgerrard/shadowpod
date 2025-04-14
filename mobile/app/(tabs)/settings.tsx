import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../../lib/supabase'; // Import supabase client
import { router } from 'expo-router'; // Import router for navigation

export default function SettingsScreen() {

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      // Optionally show an alert to the user
    } else {
      console.log('User logged out');
      // The root layout's auth listener should automatically redirect to /auth
    }
  };

  return (
    <View style={[tw`flex-1 justify-center items-center bg-[#1a1f2e] p-4`]}>
      <Text style={tw`text-white text-2xl font-bold mb-8`}>Settings</Text>
      <Text style={tw`text-gray-400 text-center mb-8`}>
        This screen will contain user settings, like level selection and account management.
      </Text>
      <TouchableOpacity
        style={tw`bg-red-600 px-6 py-3 rounded-lg`}
        onPress={handleLogout}
      >
        <Text style={tw`text-white font-medium text-base`}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}