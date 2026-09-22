import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { HapticPressable } from '../components/HapticPressable';
import { colors, widgetTextColorOptions } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useTranslation } from '../i18n';
import {
  DEFAULT_WIDGET_CAPTION_COLOR,
  DEFAULT_WIDGET_NICKNAME_COLOR,
  DEFAULT_WIDGET_OPACITY,
  getWidgetCaptionColor,
  getWidgetNicknameColor,
  getWidgetOpacity,
  setWidgetCaptionColor,
  setWidgetNicknameColor,
  setWidgetOpacity,
} from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'WidgetSettings'>;

export function WidgetSettingsScreen({}: Props) {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(DEFAULT_WIDGET_OPACITY);
  const [nicknameColor, setNicknameColor] = useState<string>(DEFAULT_WIDGET_NICKNAME_COLOR);
  const [captionColor, setCaptionColor] = useState<string>(DEFAULT_WIDGET_CAPTION_COLOR);

  useEffect(() => {
    getWidgetOpacity().then(setOpacity);
    getWidgetNicknameColor().then(setNicknameColor);
    getWidgetCaptionColor().then(setCaptionColor);
  }, []);

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('widgetSettings.title')}</Text>
      <Text style={styles.desc}>{t('widgetSettings.desc')}</Text>

      <View style={styles.sliderRow}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={Math.round(opacity * 100)}
          onValueChange={(value) => setOpacity(value / 100)}
          onSlidingComplete={(value) => setWidgetOpacity(value / 100).catch(() => {})}
          minimumTrackTintColor={colors.ink}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.ink}
        />
        <Text style={styles.sliderValue}>{Math.round(opacity * 100)}%</Text>
      </View>

      <ColorPicker
        label={t('widgetSettings.nicknameColor')}
        selected={nicknameColor}
        onSelect={(color) => {
          setNicknameColor(color);
          setWidgetNicknameColor(color).catch(() => {});
        }}
      />

      <ColorPicker
        label={t('widgetSettings.captionColor')}
        selected={captionColor}
        onSelect={(color) => {
          setCaptionColor(color);
          setWidgetCaptionColor(color).catch(() => {});
        }}
        last
      />
    </ScreenContainer>
  );
}

function ColorPicker({
  label,
  selected,
  onSelect,
  last,
}: {
  label: string;
  selected: string;
  onSelect: (color: string) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.pickerSection, last && styles.pickerSectionLast]}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.swatchRow}>
        {widgetTextColorOptions.map((color) => (
          <HapticPressable key={color} onPress={() => onSelect(color)} style={styles.swatchWrap}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: color },
                selected === color && styles.swatchSelected,
              ]}
            />
          </HapticPressable>
        ))}
      </View>
    </View>
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
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 24,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    width: 44,
    textAlign: 'right',
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickerSectionLast: {
    marginBottom: 0,
  },
  pickerLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
  },
  swatchWrap: {
    padding: 4,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
