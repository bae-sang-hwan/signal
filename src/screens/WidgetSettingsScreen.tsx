import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { WidgetPreview } from 'react-native-android-widget';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { HapticPressable } from '../components/HapticPressable';
import { colors, widgetTextColorOptions } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useTranslation } from '../i18n';
import { PartnerStatusWidget } from '../widgets/PartnerStatusWidget';
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

const TRACK_HEIGHT = 12;
const THUMB_SIZE = 28;

export function WidgetSettingsScreen({}: Props) {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(DEFAULT_WIDGET_OPACITY);
  const [nicknameColor, setNicknameColor] = useState<string>(DEFAULT_WIDGET_NICKNAME_COLOR);
  const [captionColor, setCaptionColor] = useState<string>(DEFAULT_WIDGET_CAPTION_COLOR);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    getWidgetOpacity().then(setOpacity);
    getWidgetNicknameColor().then(setNicknameColor);
    getWidgetCaptionColor().then(setCaptionColor);
  }, []);

  // WidgetPreview asks the native side to re-rasterize on every render, so
  // feeding it opacity straight from onValueChange (fires per-pixel while
  // dragging) floods it with requests and the image flickers. Debounce so it
  // only re-renders once the value has settled for a moment.
  const [previewOpacity, setPreviewOpacity] = useState(opacity);
  useEffect(() => {
    const timeout = setTimeout(() => setPreviewOpacity(opacity), 80);
    return () => clearTimeout(timeout);
  }, [opacity]);

  const renderPreview = useCallback(
    () => (
      <PartnerStatusWidget
        statuses={[
          {
            uid: 'preview',
            nickname: t('widgetSettings.previewNickname'),
            color: 'green',
            caption: t('widgetSettings.previewCaption'),
          },
        ]}
        emptyText={t('widget.empty')}
        opacity={previewOpacity}
        nicknameColor={nicknameColor as `#${string}`}
        captionColor={captionColor as `#${string}`}
      />
    ),
    [previewOpacity, nicknameColor, captionColor, t],
  );

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('widgetSettings.title')}</Text>
      <Text style={styles.desc}>{t('widgetSettings.desc')}</Text>

      <View style={styles.previewWrap}>
        <WidgetPreview width={320} height={130} renderWidget={renderPreview} />
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.pickerLabel}>{t('widgetSettings.opacityLabel')}</Text>
        <View style={styles.sliderTrackWrap}>
          <View
            style={styles.sliderTrackBg}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          />
          <View style={[styles.sliderTrackFill, { width: opacity * trackWidth }]} />
          <View
            pointerEvents="none"
            style={[styles.sliderThumb, { left: opacity * trackWidth - THUMB_SIZE / 2 }]}
          />
          <Slider
            style={styles.sliderNative}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={Math.round(opacity * 100)}
            onValueChange={(value) => setOpacity(value / 100)}
            onSlidingComplete={(value) => setWidgetOpacity(value / 100).catch(() => {})}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="transparent"
          />
        </View>
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

function getCheckColor(swatchColor: string): string {
  return swatchColor === colors.ink || swatchColor === colors.muted ? '#FFFFFF' : '#000000';
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
            <View style={[styles.swatch, { backgroundColor: color }]} />
            {selected === color ? (
              <View style={styles.swatchCheck} pointerEvents="none">
                <Ionicons name="checkmark" size={18} color={getCheckColor(color)} />
              </View>
            ) : null}
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
  previewWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  sliderRow: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 24,
  },
  sliderTrackWrap: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  sliderValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  sliderTrackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.border,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.ink,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  sliderNative: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    position: 'relative',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchCheck: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
