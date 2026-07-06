import { colors } from '@/design/tokens';
import { RepositoryProvider } from '@/providers/RepositoryProvider';
import { ErrorBoundary } from '@/stability/ErrorBoundary';
import { installGlobalErrorHandler } from '@/stability/globalErrorHandler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

installGlobalErrorHandler();

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RepositoryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="player/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack>
      </RepositoryProvider>
    </ErrorBoundary>
  );
}
