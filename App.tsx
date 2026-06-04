import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SmsAutoCapture } from '@/components/SmsAutoCapture';
import { useTheme } from '@/hooks/useTheme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { QueryProvider } from '@/providers/QueryProvider';

export default function App() {
  const { isDark } = useTheme();
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <RootNavigator />
        <SmsAutoCapture />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </QueryProvider>
  );
}
