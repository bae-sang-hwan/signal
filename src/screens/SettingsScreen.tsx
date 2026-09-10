import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { deleteUser, signOut } from '@react-native-firebase/auth';
import {
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { LabeledField } from '../components/LabeledField';
import { PrimaryButton } from '../components/PrimaryButton';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { isValidNickname, NICKNAME_MAX_LEN } from '../lib/nickname';
import { usePartner } from '../lib/usePartner';
import { checkNotificationPermission, openNotificationSettings } from '../lib/fcm';
import { clearAllPartnerStatuses, clearMyStatus, removePartnerStatus } from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [pairIds, setPairIds] = useState<string[]>([]);
  const [notificationsGranted, setNotificationsGranted] = useState<boolean | null>(null);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const [disconnectingPairId, setDisconnectingPairId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const data = snap.data();
      if (!data) return;
      setNickname(data.nickname ?? '');
      setPairIds((data.pairIds as string[] | undefined) ?? []);
    });
  }, [navigation, uid]);

  // 시스템 알림 권한은 앱 안에서 못 바꾸니, 설정 화면에 다시 돌아올 때마다
  // (시스템 설정에서 바꾸고 왔을 수 있으니) 현재 상태를 다시 읽는다.
  useFocusEffect(
    useCallback(() => {
      checkNotificationPermission()
        .then(setNotificationsGranted)
        .catch(() => setNotificationsGranted(null));
    }, []),
  );

  function openNicknameEditor() {
    setNicknameDraft(nickname ?? '');
    setNicknameError(null);
    setEditingNickname(true);
  }

  async function handleSaveNickname() {
    const trimmed = nicknameDraft.trim();
    if (!uid || !isValidNickname(trimmed) || savingNickname) return;
    setSavingNickname(true);
    setNicknameError(null);
    try {
      await updateDoc(doc(db, 'users', uid), { nickname: trimmed });
      setEditingNickname(false);
    } catch {
      setNicknameError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSavingNickname(false);
    }
  }

  function handleDisconnect(pairId: string, partnerUid: string, partnerNickname: string) {
    Alert.alert('연결을 해제할까요?', `${partnerNickname}님과의 연결이 끊어져요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '연결 해제',
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          setDisconnectingPairId(pairId);
          try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'users', uid), { pairIds: arrayRemove(pairId) });
            batch.update(doc(db, 'users', partnerUid), { pairIds: arrayRemove(pairId) });
            await batch.commit();
            await removePartnerStatus(partnerUid);
          } catch {
            Alert.alert('연결 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
          } finally {
            setDisconnectingPairId(null);
          }
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    if (deletingAccount) return;
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 닉네임, 시그널 기록 등 모든 데이터가 삭제되고 되돌릴 수 없어요. 정말 탈퇴하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            setDeletingAccount(true);
            try {
              const pairSnaps = await Promise.all(
                pairIds.map((pairId) => getDoc(doc(db, 'pairs', pairId))),
              );
              const batch = writeBatch(db);
              pairSnaps.forEach((snap, i) => {
                const data = snap.data();
                if (!data) return;
                const partnerUid = data.hostUid === user.uid ? data.guestUid : data.hostUid;
                if (partnerUid) {
                  batch.update(doc(db, 'users', partnerUid), { pairIds: arrayRemove(pairIds[i]) });
                }
              });
              batch.delete(doc(db, 'users', user.uid));
              await batch.commit();
              await clearAllPartnerStatuses();
              await clearMyStatus();
              try {
                await deleteUser(user);
              } catch {
                await signOut(auth);
              }
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch {
              Alert.alert('탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  }

  if (nickname === null || !uid) {
    return (
      <ScreenContainer style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.content}>
      <Text style={styles.title}>설정</Text>

      {editingNickname ? (
        <View style={styles.editorWrap}>
          <LabeledField
            label="닉네임"
            value={nicknameDraft}
            onChangeText={(t) => {
              setNicknameError(null);
              setNicknameDraft(t);
            }}
            maxLength={NICKNAME_MAX_LEN}
            autoFocus
            error={nicknameError}
          />
          <View style={styles.editorButtons}>
            <HapticPressable onPress={() => setEditingNickname(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelLabel}>취소</Text>
            </HapticPressable>
            <View style={styles.saveBtnWrap}>
              <PrimaryButton
                label="저장"
                onPress={handleSaveNickname}
                disabled={!isValidNickname(nicknameDraft.trim())}
                loading={savingNickname}
              />
            </View>
          </View>
        </View>
      ) : (
        <Row label="닉네임 변경" value={nickname} onPress={openNicknameEditor} />
      )}

      <Row
        label="색상 문구 편집"
        value="›"
        onPress={() => navigation.navigate('ColorCaptions')}
      />

      <Row
        label="알림"
        value={notificationsGranted === null ? '' : notificationsGranted ? '켜짐' : '꺼짐'}
        onPress={openNotificationSettings}
      />

      {pairIds.map((pairId) => (
        <PartnerRow
          key={pairId}
          pairId={pairId}
          myUid={uid}
          disconnecting={disconnectingPairId === pairId}
          onDisconnect={handleDisconnect}
        />
      ))}

      <Row
        label="회원 탈퇴"
        danger
        disabled={deletingAccount}
        onPress={handleDeleteAccount}
        last
      />
    </ScreenContainer>
  );
}

function PartnerRow({
  pairId,
  myUid,
  disconnecting,
  onDisconnect,
}: {
  pairId: string;
  myUid: string;
  disconnecting: boolean;
  onDisconnect: (pairId: string, partnerUid: string, partnerNickname: string) => void;
}) {
  const { partnerUid, nickname } = usePartner(pairId, myUid);
  if (!partnerUid) return null;
  return (
    <Row
      label="연결 해제"
      value={nickname}
      danger
      disabled={disconnecting}
      onPress={() => onDisconnect(pairId, partnerUid, nickname)}
    />
  );
}

function Row({
  label,
  value,
  danger,
  disabled,
  last,
  onPress,
}: {
  label: string;
  value?: string;
  danger?: boolean;
  disabled?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <HapticPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.row, last && styles.rowLast]}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 30,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  rowLabelDanger: {
    color: colors.red,
  },
  rowValue: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
  },
  editorWrap: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editorButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    height: 54,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
  },
  saveBtnWrap: {
    flex: 1,
  },
});
