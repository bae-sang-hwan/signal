import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { HapticPressable } from './HapticPressable';

export function SettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <HapticPressable onPress={onPress} style={styles.btn} hitSlop={8}>
      <Ionicons name="settings-outline" size={22} color={colors.muted} />
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
