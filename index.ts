import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import App from './App';
import { widgetTaskHandler } from './src/widgets/widget-task-handler';
import { upsertPartnerStatus } from './src/lib/partnerStatusCache';
import { SignalColor } from './src/theme/colors';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

registerWidgetTaskHandler(widgetTaskHandler);

// 앱이 백그라운드/종료 상태여도 연결된 누군가의 색상 변경 FCM을 받으면
// 위젯 캐시를 갱신해서 홈 화면 위젯이 30분 주기를 기다리지 않게 한다.
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const data = remoteMessage.data;
  if (data?.type !== 'colorChanged') return;
  await upsertPartnerStatus({
    uid: String(data.uid ?? ''),
    nickname: String(data.nickname ?? ''),
    color: data.color as SignalColor,
    caption: String(data.caption ?? ''),
    updatedAt: Number(data.updatedAt) || Date.now(),
  });
});
