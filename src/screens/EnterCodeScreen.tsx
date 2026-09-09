import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc, serverTimestamp, Timestamp, writeBatch } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { CodeBoxInput } from '../components/CodeBoxInput';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';

const CODE_LENGTH = 5;

type Props = NativeStackScreenProps<RootStackParamList, 'EnterCode'>;

export function EnterCodeScreen({ navigation }: Props) {
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
        setError('코드를 다시 확인해주세요.');
        setCode('');
        return;
      }

      const expiresAt = data.expiresAt as Timestamp | undefined;
      if ((expiresAt?.toMillis() ?? 0) < Date.now()) {
        setError('코드가 만료됐어요, 새로 요청해주세요.');
        setCode('');
        return;
      }

      const batch = writeBatch(db);
      batch.update(pairRef, { guestUid: uid, status: 'active', connectedAt: serverTimestamp() });
      batch.update(doc(db, 'users', data.hostUid), { pairId: fullCode });
      batch.update(doc(db, 'users', uid), { pairId: fullCode });
      await batch.commit();

      navigation.reset({ index: 0, routes: [{ name: 'HomeConnected' }] });
    } catch {
      setError('연결에 실패했어요. 잠시 후 다시 시도해주세요.');
      setCode('');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>코드를 입력하세요</Text>
      <Text style={styles.desc}>상대가 보내준 5자리 코드를 넣어주세요.</Text>

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
