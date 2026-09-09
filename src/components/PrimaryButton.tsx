import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { HapticPressable } from './HapticPressable';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'solid',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'ghost';
}) {
  const isDisabled = disabled || loading;
  const isGhost = variant === 'ghost';
  return (
    <HapticPressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        isGhost && styles.btnGhost,
        isDisabled && (isGhost ? styles.btnGhostDisabled : styles.btnDisabled),
        pressed && !isDisabled && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.ink : colors.bg} />
      ) : (
        <Text
          style={[
            styles.label,
            isGhost && styles.labelGhost,
            isDisabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    backgroundColor: colors.border,
  },
  btnGhostDisabled: {
    borderColor: colors.border,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.bg,
  },
  labelGhost: {
    color: colors.ink,
  },
  labelDisabled: {
    color: colors.faint,
  },
});
