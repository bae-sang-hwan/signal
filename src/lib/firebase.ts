import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// @react-native-firebase는 네이티브 설정 파일(google-services.json)에서
// 프로젝트 설정을 자동으로 읽으므로 별도 초기화가 필요 없습니다.
export const auth = getAuth();
export const db = getFirestore();
