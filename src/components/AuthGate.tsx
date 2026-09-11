import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAppSelector } from '../store';

/**
 * Signing in is required. Anything outside the (auth) group is redirected to
 * the login screen until a session exists, and a signed-in student is pushed
 * out of the auth screens back into the app.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isInitialized = useAppSelector((s) => s.auth.isInitialized);

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    // Wait until the stored session has been read, otherwise a returning
    // student is bounced to the login screen for a frame.
    if (!isInitialized) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isInitialized, inAuthGroup]);

  if (!isInitialized) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <View className="w-16 h-16 rounded-2xl bg-emerald-600 items-center justify-center mb-4">
          <Text className="text-3xl font-black text-white">E</Text>
        </View>
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return <>{children}</>;
}
