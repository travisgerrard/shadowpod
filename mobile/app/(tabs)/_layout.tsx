import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Example icon library

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide header for tab screens
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#1a1f2e', // Match auth screen background
          borderTopColor: '#333',
        },
      }}
    >
      <Tabs.Screen
        name="story"
        options={{
          title: 'Story',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shadowing"
        options={{
          title: 'Shadowing',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ear-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompts"
        options={{
          title: 'Prompts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Keep Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Add History Tab back */}
      <Tabs.Screen
        name="past-lessons"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}