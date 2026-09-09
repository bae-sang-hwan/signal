import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
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

        <Text style={styles.fieldLabel}>전화번호</Text>
        <TextInput
          value={display}
          onChangeText={handleChangeText}
          placeholder="010 · 0000 · 0000"
          placeholderTextColor={colors.faint}
          keyboardType="number-pad"
          style={styles.field}
          maxLength={17}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.btnWrap}>
          <PrimaryButton
            label="인증번호 받기"
            onPress={handleSubmit}
            disabled={!isValid}
            loading={loading}
          />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert('문제가 있나요?', '번호를 다시 확인하거나 앱을 재시작해보세요.')
          }
          style={styles.linkWrap}
        >
          <Text style={styles.link}>문제가 있나요?</Text>
        </Pressable>
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
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 32,
    marginBottom: 8,
  },
  field: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.red,
    marginTop: 8,
  },
  btnWrap: {
    marginTop: 28,
  },
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
