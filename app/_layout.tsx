// template
import ChatFloatingButton from "@/components/ChatFloatingButton";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MoodProvider } from "@/contexts/MoodContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const PRE_AUTH_SCREENS = ["login", "signup", "verify-otp"];

function RootLayoutNav() {
  const { isAuthenticated, isLoading, profileComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentScreen = segments[0] ?? "";
    const isOnPreAuthScreen = PRE_AUTH_SCREENS.includes(currentScreen);

    // Not authenticated and not on a pre-auth screen → go to login
    if (!isAuthenticated && !isOnPreAuthScreen && currentScreen !== "complete-profile") {
      router.replace("/login");
      return;
    }

    // Authenticated but on a pre-auth screen (login/signup/verify-otp)
    if (isAuthenticated && isOnPreAuthScreen) {
      if (profileComplete) {
        router.replace("/(tabs)");
      } else {
        router.replace("/complete-profile" as any);
      }
      return;
    }

    // Authenticated with INCOMPLETE profile on any other screen → redirect to complete-profile
    // This catches Google OAuth users who land on /(tabs) after redirect
    if (isAuthenticated && !profileComplete && currentScreen !== "complete-profile") {
      router.replace("/complete-profile" as any);
      return;
    }
  }, [isAuthenticated, isLoading, profileComplete, segments, router]);

  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="mood-detail/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      {isAuthenticated && profileComplete && <ChatFloatingButton />}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MoodProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </MoodProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
