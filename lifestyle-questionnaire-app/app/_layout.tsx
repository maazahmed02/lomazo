import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.headerBackground} />
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background
          },
          animation: 'fade_from_bottom',
        }} 
      />
    </SafeAreaProvider>
  );
}
