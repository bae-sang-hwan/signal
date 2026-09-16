import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { LabeledField } from '../components/LabeledField';
import { Checkbox } from '../components/Checkbox';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth } from '../lib/firebase';
import { extractDigits, formatKoreanPhone, isValidKoreanPhone, toE164 } from '../lib/phone';
import { setPendingConfirmation } from '../lib/pendingAuth';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function mapAuthError(code: string): string {
    switch (code) {
      case 'auth/invalid-phone-number':
        return t('login.errorInvalidPhone');
      case 'auth/too-many-requests':
      case 'auth/quota-exceeded':
        return t('login.errorTooManyRequests');
      case 'auth/network-request-failed':
        return t('login.errorNetwork');
      default:
        return t('login.errorGeneric');
    }
  }

  // Firebase 기기 단위 차단(too-many-requests)은 짧은 재시도 연타로 더 악화되므로,
  // 실패 유형별로 재시도 쿨다운을 둬서 연타를 막는다.
  function cooldownSecondsFor(code: string): number {
    switch (code) {
      case 'auth/too-many-requests':
      case 'auth/quota-exceeded':
        return 60;
      case 'auth/invalid-phone-number':
        return 0;
      default:
        return 15;
    }
  }

  const digits = extractDigits(display);
  const isValid = isValidKoreanPhone(digits);
  const displayError =
    error && cooldown > 0 ? `${error} ${t('common.retryIn', { n: cooldown })}` : error;

  function handleChangeText(text: string) {
    setError(null);
    setDisplay(formatKoreanPhone(extractDigits(text)));
  }

  async function handleSubmit() {
    if (!isValid || !agreed || loading || cooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const confirmation = await signInWithPhoneNumber(auth, toE164(digits));
      setPendingConfirmation(confirmation);
      navigation.navigate('OtpVerify', { phoneDigits: digits });
    } catch (e: any) {
      console.warn('[phone-auth] signInWithPhoneNumber failed', e?.code, e?.message);
      setError(mapAuthError(e?.code ?? ''));
      setCooldown(cooldownSecondsFor(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer style={styles.content}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.desc}>{t('login.desc')}</Text>

        <LabeledField
          label={t('login.phoneLabel')}
          value={display}
          onChangeText={handleChangeText}
          placeholder={t('login.phonePlaceholder')}
          keyboardType="number-pad"
          maxLength={17}
          error={displayError}
        />

        <View style={styles.agreeRow}>
          <Checkbox checked={agreed} onToggle={() => setAgreed((a) => !a)} />
          <Text style={styles.agreeLabel}>{t('login.agreeLabel')}</Text>
          <HapticPressable onPress={() => navigation.navigate('PrivacyPolicy')} hitSlop={8}>
            <Text style={styles.agreeLink}>{t('login.agreeView')}</Text>
          </HapticPressable>
        </View>

        <View style={styles.btnWrap}>
          <PrimaryButton
            label={t('login.submit')}
            onPress={handleSubmit}
            disabled={!isValid || !agreed || cooldown > 0}
            loading={loading}
          />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 44,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.ink,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.muted,
    lineHeight: 21,
    marginTop: 10,
  },
  btnWrap: {
    marginTop: 28,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
  },
  agreeLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.ink,
  },
  agreeLink: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
