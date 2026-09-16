import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { CodeBoxInput } from '../components/CodeBoxInput';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { formatKoreanPhone, toE164 } from '../lib/phone';
import { clearPendingConfirmation, getPendingConfirmation, setPendingConfirmation } from '../lib/pendingAuth';
import { useTranslation } from '../i18n';

const CODE_LENGTH = 6;

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { phoneDigits } = route.params;
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function mapConfirmError(code: string): string {
    switch (code) {
      case 'auth/invalid-verification-code':
        return t('otpVerify.errorInvalidCode');
      case 'auth/code-expired':
        return t('otpVerify.errorExpired');
      default:
        return t('otpVerify.errorGeneric');
    }
  }

  function mapResendError(code: string): string {
    switch (code) {
      case 'auth/too-many-requests':
      case 'auth/quota-exceeded':
        return t('otpVerify.resendErrorTooManyRequests');
      case 'auth/network-request-failed':
        return t('otpVerify.resendErrorNetwork');
      default:
        return t('otpVerify.resendError');
    }
  }

  // 재전송 연타가 Firebase 기기 단위 차단(too-many-requests)을 유발할 수 있어
  // 성공 시에도 쿨다운을 두고, 실패 유형별로 쿨다운 길이를 다르게 준다.
  function resendCooldownFor(code: string): number {
    switch (code) {
      case 'auth/too-many-requests':
      case 'auth/quota-exceeded':
        return 60;
      default:
        return 15;
    }
  }

  useEffect(() => {
    if (!getPendingConfirmation()) {
      navigation.replace('Login');
    }
  }, [navigation]);

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      void handleVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleVerify(fullCode: string) {
    const confirmation = getPendingConfirmation();
    if (!confirmation || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const credential = await confirmation.confirm(fullCode);
      const uid = credential?.user.uid;
      if (!uid) throw new Error('no-uid');
      clearPendingConfirmation();

      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) {
        navigation.reset({ index: 0, routes: [{ name: 'Nickname' }] });
        return;
      }
      const data = snap.data();
      const pairIds = (data?.pairIds as string[] | undefined) ?? [];
      navigation.reset({
        index: 0,
        routes: [{ name: pairIds.length > 0 ? 'HomeConnected' : 'HomeSolo' }],
      });
    } catch (e: any) {
      console.warn('[phone-auth] confirmation.confirm failed', e?.code, e?.message);
      setError(mapConfirmError(e?.code ?? ''));
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      const confirmation = await signInWithPhoneNumber(auth, toE164(phoneDigits));
      setPendingConfirmation(confirmation);
      setCode('');
      setResendCooldown(30);
    } catch (e: any) {
      console.warn('[phone-auth] resend signInWithPhoneNumber failed', e?.code, e?.message);
      setError(mapResendError(e?.code ?? ''));
      setResendCooldown(resendCooldownFor(e?.code ?? ''));
    } finally {
      setResending(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('otpVerify.title')}</Text>
      <Text style={styles.desc}>{t('otpVerify.desc', { phone: formatKoreanPhone(phoneDigits) })}</Text>

      <CodeBoxInput
        length={CODE_LENGTH}
        value={code}
        onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        editable={!verifying}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <HapticPressable
        onPress={handleResend}
        disabled={resending || resendCooldown > 0}
        style={styles.linkWrap}
      >
        <Text style={styles.link}>
          {resending
            ? t('otpVerify.resendResending')
            : resendCooldown > 0
              ? t('otpVerify.resendCooldown', { n: resendCooldown })
              : t('otpVerify.resendLink')}
        </Text>
      </HapticPressable>
    </ScreenContainer>
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
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.red,
    marginTop: 16,
  },
  linkWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
