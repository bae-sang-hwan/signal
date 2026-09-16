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
import { registerFcmToken } from '../lib/fcm';
import { isValidNickname, NICKNAME_MAX_LEN } from '../lib/nickname';
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Nickname'>;

export function NicknameScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation]);

  const trimmed = nickname.trim();
  const isValid = isValidNickname(trimmed);

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
        pairIds: [],
        createdAt: serverTimestamp(),
      });
      registerFcmToken(uid).catch(() => {});
      navigation.reset({ index: 0, routes: [{ name: 'HomeSolo' }] });
    } catch {
      setError(t('nickname.errorSave'));
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
        <Text style={styles.title}>{t('nickname.title')}</Text>
        <Text style={styles.desc}>{t('nickname.desc')}</Text>

        <LabeledField
          label={t('nickname.label')}
          value={nickname}
          onChangeText={(next) => {
            setError(null);
            setNickname(next);
          }}
          placeholder={t('nickname.placeholder')}
          maxLength={NICKNAME_MAX_LEN}
          autoFocus
          error={error}
        />

        <View style={styles.btnWrap}>
          <PrimaryButton
            label={t('nickname.next')}
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
