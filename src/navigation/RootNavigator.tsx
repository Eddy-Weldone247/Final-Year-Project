import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import { useDevAutoLogin } from '@/hooks/useDevAutoLogin';
import { useTheme } from '@/hooks/useTheme';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MIN_SPLASH_MS = 1700;

/** Switches between onboarding, the auth flow, and the main app. */
export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);

  // DEV ONLY: skip the auth form by auto-logging into the demo account.
  const autoLoggingIn = useDevAutoLogin();

  // Keep the branded splash on screen for a minimum, delightful moment.
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  // Drives default header/tab-bar/screen backgrounds across all navigators.
  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  // Wait for both persisted stores and the minimum splash window.
  if (!hasHydrated || !onboardingHydrated || autoLoggingIn || !minElapsed) {
    return <SplashScreen />;
  }

  // First launch: show onboarding before the auth flow.
  if (!isAuthenticated && !hasOnboarded) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
