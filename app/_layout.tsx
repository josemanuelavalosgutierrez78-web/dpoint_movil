import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ToastConfig';
import { useAuthStore } from '@/context/authStore';
import { authService } from '@/services/authService';
import { setLogoutListener } from '@/services/api';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setUser, logout, isBooting } = useAuthStore();

  useEffect(() => {
    setLogoutListener(() => { logout(); router.replace('/(auth)/login'); });

    (async () => {
      try {
        const ok = await authService.hasSession();
        if (ok) {
          const user = await authService.me();
          setUser(user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (isBooting) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={Colors.bgPrimary} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bgPrimary }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="operation/new"  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="operation/[id]" />
        <Stack.Screen name="accounts/new"   />
      </Stack>
      <Toast config={toastConfig} topOffset={48} />
    </GestureHandlerRootView>
  );
}
