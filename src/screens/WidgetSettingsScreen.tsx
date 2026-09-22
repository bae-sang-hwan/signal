import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useTranslation } from '../i18n';
import { DEFAULT_WIDGET_OPACITY, getWidgetOpacity, setWidgetOpacity } from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'WidgetSettings'>;

const OPACITY_OPTIONS = [1, 0.8, 0.6, 0.4];

export function WidgetSettingsScreen({}: Props) {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(DEFAULT_WIDGET_OPACITY);

  useEffect(() => {
    getWidgetOpacity().then(setOpacity);
  }, []);

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('widgetSettings.title')}</Text>
      <Text style={styles.desc}>{t('widgetSettings.desc')}</Text>

      {OPACITY_OPTIONS.map((value, i) => (
        <HapticPressable
          key={value}
          onPress={() => {
            setOpacity(value);
            setWidgetOpacity(value).catch(() => {});
          }}
          style={[styles.row, i === OPACITY_OPTIONS.length - 1 && styles.rowLast]}
        >
          <Text style={styles.rowLabel}>{Math.round(value * 100)}%</Text>
          {opacity === value ? <Text style={styles.check}>✓</Text> : null}
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
    marginBottom: 8,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
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
