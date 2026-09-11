import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../src/services/notifications';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../src/components/Toast';
import { store } from '../src/store';
import { restoreSession } from '../src/store/slices/authSlice';
import { fetchAccess } from '../src/store/slices/accessSlice';
import { restoreLanguage } from '../src/store/slices/languageSlice';
import { AuthGate } from '../src/components/AuthGate';
import { wrapRootComponent } from '../src/services/crashReporting';

function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // The chosen language is restored before the first screen paints.
    store.dispatch(restoreLanguage());

    // Bring back any stored session before the first screen paints.
    // Entitlements follow the restored session, otherwise a paying student
    // reopens the app to a locked exam.
    store.dispatch(restoreSession()).then(() => {
      if (store.getState().auth.isAuthenticated) store.dispatch(fetchAccess());
    });

    // 1. Register device for push notifications
    registerForPushNotificationsAsync();

    // 2. Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Received Push Notification:', notification.request.content.title);
    });

    // 3. Response listener (when user taps push notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.examId) {
        router.push(`/exam/${data.examId}/instructions` as any);
      } else {
        router.push('/notifications' as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <ToastProvider>
          <AuthGate>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="portal/[key]" options={{ headerShown: false }} />
              <Stack.Screen name="paper/[key]/[year]" options={{ headerShown: false }} />
              <Stack.Screen name="subject/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="subscription/pay" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/verify-email" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="change-password" options={{ headerShown: false }} />
              <Stack.Screen name="delete-account" options={{ headerShown: false }} />
              <Stack.Screen name="terms" options={{ headerShown: false }} />
              <Stack.Screen name="privacy" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ headerShown: false }} />
              <Stack.Screen name="exam/[id]/instructions" options={{ headerShown: false }} />
              <Stack.Screen
                name="exam/[id]/live"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen name="exam/[id]/result" options={{ headerShown: false }} />
              <Stack.Screen name="exam/[id]/review" options={{ headerShown: false }} />
              <Stack.Screen name="practice/session" options={{ headerShown: false }} />
              <Stack.Screen name="practice/custom" options={{ headerShown: false }} />
            </Stack>
          </AuthGate>
        </ToastProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

export default wrapRootComponent(RootLayout);
