import { Redirect } from 'expo-router';

// The root layout (_layout.tsx) now handles authentication checks.
// The root layout (_layout.tsx) now handles authentication checks.
// If the user reaches this screen, they are authenticated.
// We just need to redirect them to the default tab screen within the (tabs) group.
export default function Index() {
  // Redirect to the 'story' screen within the '(tabs)' group
  return <Redirect href="/story" />;
}
