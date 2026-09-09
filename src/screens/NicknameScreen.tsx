import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { LabeledField } from '../components/LabeledField';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';

const MIN_LEN = 2;
const MAX_LEN = 10;

type Props = NativeStackScreenProps<RootStackParamList, 'Nickname'>;

export function NicknameScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation]);

  const trimmed = nickname.trim();
  const isValid = trimmed.length >= MIN_LEN && trimmed.length <= MAX_LEN;

  async function handleSubmit() {
    const uid = auth.currentUser?.uid;
    if (!isValid || saving || !uid) return;
    setSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'users', uid), {
        nickname: trimmed,
        phoneNumber: auth.currentUser?.phoneNumber ?? null,
        currentColor: 'green',
        pairId: null,
        createdAt: serverTimestamp(),
      });
      navigation.reset({ index: 0, routes: [{ name: 'HomeSolo' }] });
    } catch {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer style={styles.content}>
        <Text style={styles.title}>이름을 알려주세요</Text>
        <Text style={styles.desc}>
          파트너 화면에 표시될 이름이에요. 나중에 바꿀 수 있어요.
        </Text>

        <LabeledField
          label="닉네임"
          value={nickname}
          onChangeText={(t) => {
            setError(null);
            setNickname(t);
          }}
          placeholder="이름을 입력해주세요"
          maxLength={MAX_LEN}
          autoFocus
          error={error}
        />

        <View style={styles.btnWrap}>
          <PrimaryButton
            label="다음"
            onPress={handleSubmit}
            disabled={!isValid}
            loading={saving}
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
