import { doc, serverTimestamp, updateDoc } from '@react-native-firebase/firestore';
import { SignalColor } from '../theme/colors';
import { db } from './firebase';

export type SignalCaptions = Record<SignalColor, string>;

export const signalOrder: SignalColor[] = ['red', 'amber', 'green'];

// 기본 색상 문구는 설정 > 색상 문구 편집에서 사용자별로 덮어쓸 수 있음.
// 덮어쓰지 않은 경우 보는 사람의 언어로 기본 문구를 보여준다.
export function resolveCaption(
  captions: Partial<SignalCaptions> | null | undefined,
  color: SignalColor,
  t: (key: string) => string,
): string {
  return captions?.[color]?.trim() || t(`signalCaptions.${color}`);
}

export function updateMyColor(uid: string, color: SignalColor) {
  return updateDoc(doc(db, 'users', uid), {
    currentColor: color,
    colorUpdatedAt: serverTimestamp(),
  });
}
