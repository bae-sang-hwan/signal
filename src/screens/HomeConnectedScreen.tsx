import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot, Timestamp } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { SignalDial } from '../components/SignalDial';
import { colors, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { nextSignalColor, signalCaption, updateMyColor } from '../lib/signalCopy';
import { formatRelativeTime } from '../lib/relativeTime';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeConnected'>;

export function HomeConnectedScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<SignalColor>('green');
  const [pairId, setPairId] = useState<string | null>(null);

  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState('');
  const [partnerColor, setPartnerColor] = useState<SignalColor>('green');
  const [partnerUpdatedAt, setPartnerUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const data = snap.data();
      if (!data) return;
      setNickname(data.nickname ?? '');
      if (data.currentColor) setMyColor(data.currentColor as SignalColor);
      if (!data.pairId) {
        navigation.reset({ index: 0, routes: [{ name: 'HomeSolo' }] });
        return;
      }
      setPairId(data.pairId as string);
    });
  }, [navigation]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !pairId) return;
    return onSnapshot(doc(db, 'pairs', pairId), (snap) => {
      const data = snap.data();
      if (!data) return;
      setPartnerUid(data.hostUid === uid ? data.guestUid : data.hostUid);
    });
  }, [pairId]);

  useEffect(() => {
    if (!partnerUid) return;
    return onSnapshot(doc(db, 'users', partnerUid), (snap) => {
      const data = snap.data();
      if (!data) return;
      setPartnerNickname(data.nickname ?? '');
      if (data.currentColor) setPartnerColor(data.currentColor as SignalColor);
      const updatedAt = data.colorUpdatedAt as Timestamp | undefined;
      setPartnerUpdatedAt(updatedAt ? updatedAt.toDate() : null);
    });
  }, [partnerUid]);

  function handleCyclePress() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const next = nextSignalColor(myColor);
    setMyColor(next);
    updateMyColor(uid, next).catch(() => {
      setMyColor(myColor);
    });
  }

  if (nickname === null || !partnerUid) {
    return (
      <ScreenContainer style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.greeting}>안녕, {nickname}</Text>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
          hitSlop={8}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <Text style={styles.dividerLabel}>내 상태</Text>
      <View style={styles.dialWrap}>
        <SignalDial color={myColor} size={118} onPress={handleCyclePress} showDots={false} />
      </View>

      <View style={styles.partnerCard}>
        <View style={[styles.partnerOrb, { backgroundColor: signalColorMap[partnerColor] }]} />
        <View style={styles.partnerText}>
          <Text style={styles.partnerName}>{partnerNickname}</Text>
          <Text style={styles.partnerCaption}>
            {signalCaption[partnerColor]} · {formatRelativeTime(partnerUpdatedAt)}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.ink,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
    color: colors.muted,
  },
  dividerLabel: {
    marginTop: 32,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  dialWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  partnerOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerText: {
    flex: 1,
  },
  partnerName: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  partnerCaption: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
