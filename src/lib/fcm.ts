import { Platform, PermissionsAndroid } from 'react-native';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { db } from './firebase';

// 파트너가 색상을 바꿨을 때 Cloud Function이 이 토큰으로 FCM을 보낸다.
export async function registerFcmToken(uid: string) {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
  if (!enabled) return;

  const token = await getToken(messaging);
  await saveFcmToken(uid, token);

  return onTokenRefresh(messaging, (nextToken) => {
    saveFcmToken(uid, nextToken).catch(() => {});
  });
}

function saveFcmToken(uid: string, token: string) {
  return updateDoc(doc(db, 'users', uid), { fcmToken: token });
}
