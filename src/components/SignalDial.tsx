import { StyleSheet, View } from 'react-native';
import { colors, signalColorMap, signalDimMap, SignalColor } from '../theme/colors';
import { signalOrder } from '../lib/signalCopy';
import { HapticPressable } from './HapticPressable';

export function SignalDial({
  color,
  size = 160,
  onPress,
  showDots = true,
}: {
  color: SignalColor;
  size?: number;
  onPress?: () => void;
  showDots?: boolean;
}) {
  const coreSize = size * 0.7;
  const ring = (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: signalDimMap[color],
        },
      ]}
    >
      <View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: signalColorMap[color],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {onPress ? <HapticPressable onPress={onPress}>{ring}</HapticPressable> : ring}
      {showDots ? (
        <View style={styles.dots}>
          {signalOrder.map((c) => (
            <View
              key={c}
              style={[
                styles.dot,
                { borderColor: signalColorMap[c] },
                c === color && { backgroundColor: signalColorMap[c] },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {},
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: colors.bg,
  },
});
