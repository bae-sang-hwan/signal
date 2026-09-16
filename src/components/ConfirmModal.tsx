import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { HapticPressable } from './HapticPressable';
import { useTranslation } from '../i18n';

export function ConfirmModal({
  visible,
  title,
  subtitle,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const cancel = cancelLabel ?? t('confirmModal.cancel');
  const confirm = confirmLabel ?? t('confirmModal.confirm');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.actions}>
            <HapticPressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelLabel}>{cancel}</Text>
            </HapticPressable>
            <HapticPressable style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmLabel}>{confirm}</Text>
            </HapticPressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,29,25,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  cancelLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  confirmLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.bg,
  },
});
