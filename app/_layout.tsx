import { useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { ShareIntentProvider } from 'expo-share-intent';
import { ShareIntentBridge } from '@/components/ShareIntentBridge';
import { OfflineBanner } from '@/components/OfflineBanner';
import { configureNotifications } from '@/lib/notifications';

function NotificationObserver() {
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledInitialResponse = useRef(false);

  useEffect(() => {
    void configureNotifications();
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    if (!handledInitialResponse.current && lastResponse?.notification) {
      handledInitialResponse.current = true;
      redirect(lastResponse.notification);
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification));
    return () => subscription.remove();
  }, [lastResponse]);

  return null;
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <ShareIntentBridge />
      <NotificationObserver />
      <OfflineBanner />
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="settings" />
      </Stack>
    </ShareIntentProvider>
  );
}
