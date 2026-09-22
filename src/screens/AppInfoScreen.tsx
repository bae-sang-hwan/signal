import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import appConfig from '../../app.json';
import { useTranslation } from '../i18n';
import { CONTACT_EMAIL } from '../lib/contact';

type Props = NativeStackScreenProps<RootStackParamList, 'AppInfo'>;

export function AppInfoScreen({ navigation }: Props) {
  const { t } = useTranslation();

  function handleContactUs() {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('settings.contactSubject'))}`);
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('appInfo.title')}</Text>

      <View style={styles.iconWrap}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} />
        <Text style={styles.appName}>{appConfig.expo.name}</Text>
      </View>

      <HapticPressable
        onPress={() => navigation.navigate('PrivacyPolicy')}
        style={styles.row}
      >
        <Text style={styles.rowLabel}>{t('appInfo.privacyPolicy')}</Text>
        <Text style={styles.rowValue}>›</Text>
      </HapticPressable>

      <HapticPressable onPress={handleContactUs} style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings.contactUs')}</Text>
        <Text style={styles.rowValue}>›</Text>
      </HapticPressable>

      <View style={[styles.row, styles.rowLast]}>
        <Text style={styles.rowLabel}>{t('appInfo.version')}</Text>
        <Text style={styles.rowValue}>{appConfig.expo.version}</Text>
      </View>
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
  iconWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  appName: {
    marginTop: 14,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
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
  rowValue: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
});
