import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '../db/schema';
import { useCardsStore } from '../store/useCardsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const loadCards = useCardsStore((state) => state.loadCards);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        await loadCards();
      } catch (e) {
        console.error('Error initializing app:', e);
      } finally {
        setDbReady(true);
        SplashScreen.hideAsync();
      }
    }
    setup();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="card/[id]" options={{ presentation: 'modal', title: 'Card Details' }} />
    </Stack>
  );
}
