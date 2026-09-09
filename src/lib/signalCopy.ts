import { doc, serverTimestamp, updateDoc } from '@react-native-firebase/firestore';
import { SignalColor } from '../theme/colors';
import { db } from './firebase';

export type SignalCaptions = Record<SignalColor, string>;

// 기본 색상 문구. 08 설정 > 색상 문구 편집에서 사용자별로 덮어쓸 수 있음.
export const defaultSignalCaptions: SignalCaptions = {
  red: '방해하지 마세요',
  amber: '바빠요',
  green: '괜찮아요',
};

export const signalOrder: SignalColor[] = ['red', 'amber', 'green'];

export function nextSignalColor(current: SignalColor): SignalColor {
  const idx = signalOrder.indexOf(current);
  return signalOrder[(idx + 1) % signalOrder.length];
}

export function resolveCaption(
  captions: Partial<SignalCaptions> | null | undefined,
  color: SignalColor,
): string {
  return captions?.[color]?.trim() || defaultSignalCaptions[color];
}

export function updateMyColor(uid: string, color: SignalColor) {
  return updateDoc(doc(db, 'users', uid), {
    currentColor: color,
    colorUpdatedAt: serverTimestamp(),
  });
}
