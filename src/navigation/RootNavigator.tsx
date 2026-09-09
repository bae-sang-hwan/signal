import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';
import { NicknameScreen } from '../screens/NicknameScreen';
import { HomeSoloScreen } from '../screens/HomeSoloScreen';
import { InviteCodeScreen } from '../screens/InviteCodeScreen';
import { EnterCodeScreen } from '../screens/EnterCodeScreen';
import { HomeConnectedScreen } from '../screens/HomeConnectedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ColorCaptionsScreen } from '../screens/ColorCaptionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        <Stack.Screen name="Nickname" component={NicknameScreen} />
        <Stack.Screen name="HomeSolo" component={HomeSoloScreen} />
        <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
        <Stack.Screen name="EnterCode" component={EnterCodeScreen} />
        <Stack.Screen name="HomeConnected" component={HomeConnectedScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ColorCaptions" component={ColorCaptionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
