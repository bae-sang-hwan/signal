import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot, Timestamp } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { SignalDial } from '../components/SignalDial';
import { SettingsButton } from '../components/SettingsButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { resolveCaption, SignalCaptions, updateMyColor } from '../lib/signalCopy';
import { formatRelativeTime } from '../lib/relativeTime';
import { usePartner } from '../lib/usePartner';
import {
  clearAllPartnerStatuses,
  removePartnerStatus,
  updateMyStatus,
  upsertPartnerStatus,
} from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeConnected'>;

export function HomeConnectedScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<SignalColor>('green');
  const [pairIds, setPairIds] = useState<string[] | null>(null);
  const partnerUidByPairId = useRef(new Map<string, string>());

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const data = snap.data();
      if (!data) return;
      const myNickname = data.nickname ?? '';
      setNickname(myNickname);
      if (data.currentColor) {
        const color = data.currentColor as SignalColor;
        setMyColor(color);
        const captions = data.captions as Partial<SignalCaptions> | undefined;
        const updatedAt = data.colorUpdatedAt as Timestamp | undefined;
        updateMyStatus({
          uid,
          nickname: myNickname,
          color,
          caption: resolveCaption(captions, color),
          updatedAt: updatedAt ? updatedAt.toMillis() : Date.now(),
        }).catch(() => {});
      }

      const nextPairIds = (data.pairIds as string[] | undefined) ?? [];
      if (nextPairIds.length === 0) {
        clearAllPartnerStatuses().catch(() => {});
        navigation.reset({ index: 0, routes: [{ name: 'HomeSolo' }] });
        return;
      }

      const known = partnerUidByPairId.current;
      for (const [pid, puid] of known) {
        if (!nextPairIds.includes(pid)) {
          removePartnerStatus(puid).catch(() => {});
          known.delete(pid);
        }
      }
      setPairIds(nextPairIds);
    });
  }, [navigation, uid]);

  function handleSelectColor(next: SignalColor) {
    if (!uid || next === myColor) return;
    setMyColor(next);
    updateMyColor(uid, next).catch(() => {
      setMyColor(myColor);
    });
  }

  function handlePartnerResolved(pairId: string, partnerUid: string) {
    partnerUidByPairId.current.set(pairId, partnerUid);
  }

  if (nickname === null || pairIds === null || !uid) {
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
        <SettingsButton onPress={() => navigation.navigate('Settings')} />
      </View>

      <Text style={styles.dividerLabel}>내 상태</Text>
      <View style={styles.dialWrap}>
        <SignalDial color={myColor} size={118} onSelectColor={handleSelectColor} />
      </View>

      <View style={styles.partnerList}>
        {pairIds.map((pairId) => (
          <PartnerCard
            key={pairId}
            pairId={pairId}
            myUid={uid}
            onResolved={handlePartnerResolved}
          />
        ))}
      </View>

      <View style={styles.inviteWrap}>
        <PrimaryButton
          label="사람 더 초대하기"
          variant="ghost"
          onPress={() => navigation.navigate('InviteCode')}
        />
      </View>
    </ScreenContainer>
  );
}

function PartnerCard({
  pairId,
  myUid,
  onResolved,
}: {
  pairId: string;
  myUid: string;
  onResolved: (pairId: string, partnerUid: string) => void;
}) {
  const { partnerUid, nickname, color, caption, updatedAt } = usePartner(pairId, myUid);

  useEffect(() => {
    if (partnerUid) onResolved(pairId, partnerUid);
  }, [pairId, partnerUid, onResolved]);

  useEffect(() => {
    if (!partnerUid) return;
    upsertPartnerStatus({
      uid: partnerUid,
      nickname,
      color,
      caption,
      updatedAt: updatedAt ? updatedAt.getTime() : Date.now(),
    }).catch(() => {});
  }, [partnerUid, nickname, color, caption, updatedAt]);

  if (!partnerUid) return null;

  return (
    <View style={styles.partnerCard}>
      <View style={[styles.partnerOrb, { backgroundColor: signalColorMap[color] }]} />
      <View style={styles.partnerText}>
        <Text style={styles.partnerName}>{nickname}</Text>
        <Text style={styles.partnerCaption}>
          {caption} · {formatRelativeTime(updatedAt)}
        </Text>
      </View>
    </View>
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
  partnerList: {
    gap: 12,
  },
  inviteWrap: {
    marginTop: 20,
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
