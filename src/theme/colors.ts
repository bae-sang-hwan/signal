// 화면설계서(screen_spec.html) 디자인 토큰과 1:1 대응.
export const colors = {
  bg: '#F6F4EF',
  ink: '#1F1D19',
  muted: '#6B675F',
  faint: '#A8A499',
  card: '#FFFFFF',
  border: '#E3E0D8',

  red: '#D64545',
  redDim: '#F3D6D3',
  redWash: '#FBF0EF',

  amber: '#DC9A2A',
  amberDim: '#F5E3C4',
  amberWash: '#FBF3E5',

  green: '#4C8C3A',
  greenDim: '#D9E6CE',
  greenWash: '#F1F6EC',
} as const;

export type SignalColor = 'red' | 'amber' | 'green';

export const signalColorMap: Record<SignalColor, string> = {
  red: colors.red,
  amber: colors.amber,
  green: colors.green,
};

export const signalDimMap: Record<SignalColor, string> = {
  red: colors.redDim,
  amber: colors.amberDim,
  green: colors.greenDim,
};

export const widgetTextColorOptions = [
  colors.ink,
  colors.muted,
  '#FFFFFF',
  colors.red,
  colors.amber,
  colors.green,
] as const;

export function hexToRgba(hex: string, alpha: number): `rgba(${number}, ${number}, ${number}, ${number})` {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
