import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { CodeBoxInput } from '../components/CodeBoxInput';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { formatKoreanPhone, toE164 } from '../lib/phone';
import { clearPendingConfirmation, getPendingConfirmation, setPendingConfirmation } from '../lib/pendingAuth';

const CODE_LENGTH = 6;

function mapConfirmError(code: string): string {
  switch (code) {
    case 'auth/invalid-verification-code':
      return '코드를 다시 확인해주세요.';
    case 'auth/code-expired':
      return '코드가 만료됐어요, 새로 요청해주세요.';
    default:
      return '인증에 실패했어요. 다시 시도해주세요.';
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ navigation, route }: Props) {
  const { phoneDigits } = route.params;
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      navigation.reset({
        index: 0,
        routes: [{ name: data?.pairId ? 'HomeConnected' : 'HomeSolo' }],
      });
    } catch (e: any) {
      setError(mapConfirmError(e?.code ?? ''));
      setCode('');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      const confirmation = await signInWithPhoneNumber(auth, toE164(phoneDigits));
      setPendingConfirmation(confirmation);
      setCode('');
    } catch {
      setError('재전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setResending(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>코드를 입력하세요</Text>
      <Text style={styles.desc}>{formatKoreanPhone(phoneDigits)}로 보낸 6자리 코드를 넣어주세요.</Text>

      <CodeBoxInput
        length={CODE_LENGTH}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        editable={!verifying}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleResend} disabled={resending} style={styles.linkWrap}>
        <Text style={styles.link}>{resending ? '재전송 중…' : '코드를 못 받았어요, 다시 보내기'}</Text>
      </Pressable>
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
