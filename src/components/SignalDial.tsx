import { StyleSheet, View } from 'react-native';
import { colors, signalColorMap, signalDimMap, SignalColor } from '../theme/colors';
import { signalOrder } from '../lib/signalCopy';
import { HapticPressable } from './HapticPressable';

export function SignalDial({
  color,
  size = 160,
  onSelectColor,
  showDots = true,
}: {
  color: SignalColor;
  size?: number;
  onSelectColor?: (color: SignalColor) => void;
  showDots?: boolean;
}) {
  const coreSize = size * 0.7;
  const dotSize = 40;

  return (
    <View style={styles.wrap}>
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
      {showDots ? (
        <View style={styles.dots}>
          {signalOrder.map((c) => {
            const selected = c === color;
            const dot = (
              <View
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    borderColor: signalColorMap[c],
                  },
                  selected && { backgroundColor: signalColorMap[c] },
                ]}
              />
            );
            return onSelectColor ? (
              <HapticPressable key={c} onPress={() => onSelectColor(c)}>
                {dot}
              </HapticPressable>
            ) : (
              <View key={c}>{dot}</View>
            );
          })}
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
    gap: 18,
    marginTop: 20,
  },
  dot: {
    borderWidth: 3,
    backgroundColor: colors.bg,
  },
});
