import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the splash screen once the component has mounted
    SplashScreen.hideAsync();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}