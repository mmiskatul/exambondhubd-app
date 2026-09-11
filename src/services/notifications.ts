import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from './api';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied by user.');
      return null;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
    } catch (e: any) {
      console.log('Could not obtain native Expo push token:', e.message);
      token = `ExponentPushToken[local_device_${Date.now()}]`;
    }
  } else {
    // Simulator/Emulator fallback
    token = `ExponentPushToken[simulator_device_${Date.now()}]`;
  }

  if (token) {
    await AsyncStorage.setItem('user_fcm_token', token);
    try {
      // Sync device token with ExamBondhuBD backend
      await mobileApi('/notifications/token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      console.log('Token sync notice:', err.message);
    }
  }

  return token;
}
