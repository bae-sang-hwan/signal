import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { AppLanguage, useTranslation } from '../i18n';
import { updateWidget } from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

export function LanguageScreen({}: Props) {
  const { t, language, setLanguage } = useTranslation();

  const options: { value: AppLanguage; label: string }[] = [
    { value: 'ko', label: t('language.korean') },
    { value: 'en', label: t('language.english') },
    { value: 'ja', label: t('language.japanese') },
  ];

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('language.title')}</Text>

      {options.map((opt, i) => (
        <HapticPressable
          key={opt.value}
          onPress={() => {
            setLanguage(opt.value).then(() => updateWidget().catch(() => {}));
          }}
          style={[styles.row, i === options.length - 1 && styles.rowLast]}
        >
          <Text style={styles.rowLabel}>{opt.label}</Text>
          {language === opt.value ? <Text style={styles.check}>✓</Text> : null}
        </HapticPressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 30,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  check: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
});
