import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { generateInviteCode, INVITE_TTL_MS } from '../lib/inviteCode';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteCode'>;

export function InviteCodeScreen({ navigation }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    let cancelled = false;

    async function loadOrCreateCode() {
      try {
        const existing = await getDocs(
          query(
            collection(db, 'pairs'),
            where('hostUid', '==', uid),
            where('status', '==', 'pending'),
            limit(10),
          ),
        );
        const now = Date.now();
        const stillValid = existing.docs.find((d) => {
          const expiresAt = d.data().expiresAt as Timestamp | undefined;
          return (expiresAt?.toMillis() ?? 0) > now;
        });
        if (stillValid) {
          if (!cancelled) setCode(stillValid.id);
          return;
        }

        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = generateInviteCode();
          const ref = doc(db, 'pairs', candidate);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              hostUid: uid,
              status: 'pending',
              createdAt: serverTimestamp(),
              expiresAt: Timestamp.fromMillis(now + INVITE_TTL_MS),
            });
            if (!cancelled) setCode(candidate);
            return;
          }
        }
        if (!cancelled) setError('코드 생성에 실패했어요. 다시 시도해주세요.');
      } catch {
        if (!cancelled) setError('코드 생성에 실패했어요. 다시 시도해주세요.');
      }
    }

    loadOrCreateCode();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  function handleShare() {
    if (!code) return;
    Share.share({
      message: `시그널에서 함께해요! 초대 코드: ${code}\n앱을 열고 이 코드를 입력하면 연결돼요.`,
    });
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>이 코드를 상대에게 보내세요</Text>

      {code ? (
        <Text style={styles.code}>{code.split('').join(' ')}</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ActivityIndicator style={styles.spinner} color={colors.ink} />
      )}

      <PrimaryButton label="공유하기" onPress={handleShare} disabled={!code} />

      <Pressable
        onPress={() => navigation.navigate('EnterCode')}
        style={styles.linkWrap}
      >
        <Text style={styles.link}>이미 코드를 받으셨나요? 입력하기</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 38,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  code: {
    marginTop: 40,
    marginBottom: 40,
    fontFamily: fonts.bold,
    fontSize: 40,
    letterSpacing: 4,
    color: colors.ink,
    textAlign: 'center',
  },
  spinner: {
    alignSelf: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  error: {
    marginTop: 40,
    marginBottom: 40,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.red,
    textAlign: 'center',
  },
  linkWrap: {
    marginTop: 22,
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
