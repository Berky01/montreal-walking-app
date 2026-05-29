import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalkAppProvider } from '../src/state/WalkAppContext';
import { AppHeader } from '../src/components/AppHeader';
import { colors } from '../src/styles/tokens';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WalkAppProvider>
          <StatusBar style="dark" backgroundColor={colors.surface} />
          <Stack
            screenOptions={{
              header: () => <AppHeader />,
              contentStyle: { backgroundColor: colors.surface },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ title: 'Explore' }} />
            <Stack.Screen name="compare" options={{ title: 'Choose route' }} />
            <Stack.Screen name="detail" options={{ title: 'Route detail' }} />
            <Stack.Screen name="active" options={{ title: 'Walk companion' }} />
            <Stack.Screen name="complete" options={{ title: 'Walk complete' }} />
          </Stack>
        </WalkAppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
