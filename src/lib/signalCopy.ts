import { SignalColor } from '../theme/colors';

// 기본 색상 문구. 08 설정 > 색상 문구 편집에서 커플별로 바꿀 수 있게 될 예정(2차).
export const signalCaption: Record<SignalColor, string> = {
  red: '방해하지 마세요',
  amber: '바빠요',
  green: '괜찮아요',
};

export const signalOrder: SignalColor[] = ['red', 'amber', 'green'];

export function nextSignalColor(current: SignalColor): SignalColor {
  const idx = signalOrder.indexOf(current);
  return signalOrder[(idx + 1) % signalOrder.length];
}
