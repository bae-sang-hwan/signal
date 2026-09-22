import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot, Timestamp } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { SignalDial } from '../components/SignalDial';
import { SettingsButton } from '../components/SettingsButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmModal } from '../components/ConfirmModal';
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
import { useTranslation } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeConnected'>;

export function HomeConnectedScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<SignalColor>('green');
  const [myCaptions, setMyCaptions] = useState<Partial<SignalCaptions> | undefined>();
  const [pairIds, setPairIds] = useState<string[] | null>(null);
  const [pendingColor, setPendingColor] = useState<SignalColor | null>(null);
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
        setMyCaptions(captions);
        const updatedAt = data.colorUpdatedAt as Timestamp | undefined;
        updateMyStatus({
          uid,
          nickname: myNickname,
          color,
          caption: resolveCaption(captions, color, t),
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
    setPendingColor(next);
  }

  function confirmColorChange() {
    if (!uid || pendingColor === null) return;
    const next = pendingColor;
    setPendingColor(null);
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
        <Text style={styles.greeting}>{t('homeConnected.greeting', { name: nickname })}</Text>
        <SettingsButton onPress={() => navigation.navigate('Settings')} />
      </View>

      <Text style={styles.dividerLabel}>{t('homeConnected.myStatusLabel')}</Text>
      <View style={styles.dialWrap}>
        <SignalDial color={myColor} size={118} onSelectColor={handleSelectColor} />
        <Text style={styles.caption}>
          {t('homeConnected.status', { caption: resolveCaption(myCaptions, myColor, t) })}
        </Text>
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
          label={t('homeConnected.inviteMore')}
          variant="ghost"
          onPress={() => navigation.navigate('InviteCode')}
        />
      </View>

      <ConfirmModal
        visible={pendingColor !== null}
        title={t('homeConnected.confirmTitle', {
          caption: pendingColor ? resolveCaption(myCaptions, pendingColor, t) : '',
        })}
        subtitle={t('homeConnected.confirmSubtitle')}
        onCancel={() => setPendingColor(null)}
        onConfirm={confirmColorChange}
      />
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
  const { t } = useTranslation();
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
          {caption} · {formatRelativeTime(updatedAt, t)}
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
  caption: {
    marginTop: 14,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
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
