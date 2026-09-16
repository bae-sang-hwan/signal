const { withAndroidManifest } = require('@expo/config-plugins');

const ACTION_APP_NOTIFICATION_SETTINGS = 'android.settings.APP_NOTIFICATION_SETTINGS';

// Android 11+(API 30) 패키지 가시성 제한 때문에 <queries> 선언이 없으면
// 설정 화면의 "알림" 인텐트가 해석되지 않고 그냥 실패한다.
module.exports = function withAndroidNotificationSettingsQuery(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) {
      manifest.queries = [{ intent: [] }];
    }
    const queries = manifest.queries[0];
    if (!queries.intent) {
      queries.intent = [];
    }
    const alreadyDeclared = queries.intent.some(
      (intent) => intent.action?.[0]?.$?.['android:name'] === ACTION_APP_NOTIFICATION_SETTINGS,
    );
    if (!alreadyDeclared) {
      queries.intent.push({
        action: [{ $: { 'android:name': ACTION_APP_NOTIFICATION_SETTINGS } }],
      });
    }
    return config;
  });
};
