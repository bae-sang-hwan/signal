import { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { RootNavigator } from './src/navigation/RootNavigator';
import { savePartnerStatus } from './src/lib/partnerStatusCache';
import { SignalColor } from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Thin': require('./assets/fonts/Pretendard-Thin.otf'),
    'Pretendard-ExtraLight': require('./assets/fonts/Pretendard-ExtraLight.otf'),
    'Pretendard-Light': require('./assets/fonts/Pretendard-Light.otf'),
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('./assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('./assets/fonts/Pretendard-Black.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    return onMessage(getMessaging(), async (remoteMessage) => {
      const data = remoteMessage.data;
      if (data?.type !== 'colorChanged') return;
      await savePartnerStatus({
        nickname: String(data.nickname ?? ''),
        color: data.color as SignalColor,
        caption: String(data.caption ?? ''),
        updatedAt: Number(data.updatedAt) || Date.now(),
      });
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
