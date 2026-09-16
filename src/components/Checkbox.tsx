import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { HapticPressable } from './HapticPressable';

export function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <HapticPressable
      onPress={onToggle}
      hitSlop={8}
      style={[styles.box, checked && styles.boxChecked]}
    >
      {checked ? <Text style={styles.mark}>✓</Text> : null}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  mark: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.bg,
  },
});
