import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

// conic-gradient(red 0 120deg, amber 120deg 240deg, green 240deg 360deg)
// 를 3등분 파이 조각으로 재현. 0deg는 12시 방향, 시계 방향으로 진행.
function pieSlice(cx: number, r: number, fromDeg: number, toDeg: number) {
  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cx - r * Math.cos(rad)];
  };
  const [x1, y1] = toXY(fromDeg);
  const [x2, y2] = toXY(toDeg);
  return `M ${cx} ${cx} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function BrandMark({ size = 68 }: { size?: number }) {
  const cx = size / 2;
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={pieSlice(cx, r, 0, 120)} fill={colors.red} />
      <Path d={pieSlice(cx, r, 120, 240)} fill={colors.amber} />
      <Path d={pieSlice(cx, r, 240, 360)} fill={colors.green} />
    </Svg>
  );
}
