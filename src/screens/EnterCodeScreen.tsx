import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { CodeBoxInput } from '../components/CodeBoxInput';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { useTranslation } from '../i18n';

const CODE_LENGTH = 5;

type Props = NativeStackScreenProps<RootStackParamList, 'EnterCode'>;

export function EnterCodeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChangeText(text: string) {
    setError(null);
    const next = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) void handleConnect(next);
  }

  async function handleConnect(fullCode: string) {
    const uid = auth.currentUser?.uid;
    if (!uid || connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const pairRef = doc(db, 'pairs', fullCode);
      const snap = await getDoc(pairRef);
      const data = snap.data();

      if (!snap.exists() || !data || data.status !== 'pending' || data.hostUid === uid) {
        setError(t('enterCode.errorInvalid'));
        setCode('');
        return;
      }

      const expiresAt = data.expiresAt as Timestamp | undefined;
      if ((expiresAt?.toMillis() ?? 0) < Date.now()) {
        setError(t('enterCode.errorExpired'));
        setCode('');
        return;
      }

      const batch = writeBatch(db);
      batch.update(pairRef, { guestUid: uid, status: 'active', connectedAt: serverTimestamp() });
      batch.update(doc(db, 'users', data.hostUid), { pairIds: arrayUnion(fullCode) });
      batch.update(doc(db, 'users', uid), { pairIds: arrayUnion(fullCode) });
      await batch.commit();

      navigation.reset({ index: 0, routes: [{ name: 'HomeConnected' }] });
    } catch {
      setError(t('enterCode.errorConnect'));
      setCode('');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>{t('enterCode.title')}</Text>
      <Text style={styles.desc}>{t('enterCode.desc')}</Text>

      <CodeBoxInput
        length={CODE_LENGTH}
        value={code}
        onChangeText={handleChangeText}
        editable={!connecting}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
});
