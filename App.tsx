import { useFonts } from 'expo-font';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationManager } from '@/components/NotificationManager';
import { SmsAutoCapture } from '@/components/SmsAutoCapture';
import { useTheme } from '@/hooks/useTheme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { QueryProvider } from '@/providers/QueryProvider';
import { configureNotifications } from '@/services/notifications';
import interFonts from '@/theme/interFonts';

// Keep the native splash up until our fonts are ready (then the in-app
// animated SplashScreen takes over).
NativeSplash.preventAutoHideAsync().catch(() => {});

export default function App() {
  const { isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts(interFonts);
  const ready = fontsLoaded || !!fontError; // never block on a font failure

  useEffect(() => {
    if (ready) {
      NativeSplash.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    void configureNotifications();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryProvider>
        <SafeAreaProvider>
          <RootNavigator />
          <SmsAutoCapture />
          <NotificationManager />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </SafeAreaProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
