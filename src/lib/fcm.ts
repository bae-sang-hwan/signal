import { Linking, Platform, PermissionsAndroid } from 'react-native';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import {
  getMessaging,
  requestPermission,
  hasPermission,
  getToken,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { db } from './firebase';

const ANDROID_PACKAGE = 'com.signal.app';

function isEnabledStatus(status: number) {
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

// 시스템 알림 권한이 실제로 켜져있는지 (설정 화면 표시용).
export async function checkNotificationPermission(): Promise<boolean> {
  const status = await hasPermission(getMessaging());
  return isEnabledStatus(status);
}

// 우리 앱의 시스템 알림 설정 화면으로 이동.
export function openNotificationSettings() {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: ANDROID_PACKAGE },
    ]).catch(() => Linking.openSettings());
    return;
  }
  Linking.openSettings();
}

// 파트너가 색상을 바꿨을 때 Cloud Function이 이 토큰으로 FCM을 보낸다.
export async function registerFcmToken(uid: string) {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  if (!isEnabledStatus(authStatus)) return;

  const token = await getToken(messaging);
  await saveFcmToken(uid, token);

  return onTokenRefresh(messaging, (nextToken) => {
    saveFcmToken(uid, nextToken).catch(() => {});
  });
}

function saveFcmToken(uid: string, token: string) {
  return updateDoc(doc(db, 'users', uid), { fcmToken: token });
}
