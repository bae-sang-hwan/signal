import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { LabeledField } from '../components/LabeledField';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth } from '../lib/firebase';
import { extractDigits, formatKoreanPhone, isValidKoreanPhone, toE164 } from '../lib/phone';
import { setPendingConfirmation } from '../lib/pendingAuth';

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-phone-number':
      return '전화번호 형식을 다시 확인해주세요.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
    default:
      return '인증번호 전송에 실패했어요. 잠시 후 다시 시도해주세요.';
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [display, setDisplay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = extractDigits(display);
  const isValid = isValidKoreanPhone(digits);

  function handleChangeText(text: string) {
    setError(null);
    setDisplay(formatKoreanPhone(extractDigits(text)));
  }

  async function handleSubmit() {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const confirmation = await signInWithPhoneNumber(auth, toE164(digits));
      setPendingConfirmation(confirmation);
      navigation.navigate('OtpVerify', { phoneDigits: digits });
    } catch (e: any) {
      setError(mapAuthError(e?.code ?? ''));
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
        <Text style={styles.title}>전화번호로 시작하기</Text>
        <Text style={styles.desc}>
          번호는 파트너 연결에만 쓰이고, 다른 곳에 공개되지 않아요.
        </Text>

        <LabeledField
          label="전화번호"
          value={display}
          onChangeText={handleChangeText}
          placeholder="010-0000-0000"
          keyboardType="number-pad"
          maxLength={17}
          error={error}
        />

        <View style={styles.btnWrap}>
          <PrimaryButton
            label="인증번호 받기"
            onPress={handleSubmit}
            disabled={!isValid}
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
});
