import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        isDisabled && styles.btnDisabled,
        pressed && !isDisabled && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
      )}
    </Pressable>
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
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    backgroundColor: colors.border,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.bg,
  },
  labelDisabled: {
    color: colors.faint,
  },
});
