import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signOut } from '@react-native-firebase/auth';
import { doc, onSnapshot, updateDoc, writeBatch } from '@react-native-firebase/firestore';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { LabeledField } from '../components/LabeledField';
import { PrimaryButton } from '../components/PrimaryButton';
import { HapticPressable } from '../components/HapticPressable';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { isValidNickname, NICKNAME_MAX_LEN } from '../lib/nickname';
import { clearPartnerStatus } from '../lib/partnerStatusCache';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState('');

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const [disconnecting, setDisconnecting] = useState(false);

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
      setPairId((data.pairId as string) ?? null);
      setNotificationsEnabled(data.notificationsEnabled ?? true);
    });
  }, [navigation]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !pairId) {
      setPartnerUid(null);
      return;
    }
    return onSnapshot(doc(db, 'pairs', pairId), (snap) => {
      const data = snap.data();
      if (!data) return;
      setPartnerUid(data.hostUid === uid ? data.guestUid : data.hostUid);
    });
  }, [pairId]);

  useEffect(() => {
    if (!partnerUid) return;
    return onSnapshot(doc(db, 'users', partnerUid), (snap) => {
      setPartnerNickname(snap.data()?.nickname ?? '');
    });
  }, [partnerUid]);

  function openNicknameEditor() {
    setNicknameDraft(nickname ?? '');
    setNicknameError(null);
    setEditingNickname(true);
  }

  async function handleSaveNickname() {
    const uid = auth.currentUser?.uid;
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

  function handleToggleNotifications(next: boolean) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    Haptics.selectionAsync();
    setNotificationsEnabled(next);
    updateDoc(doc(db, 'users', uid), { notificationsEnabled: next }).catch(() => {
      setNotificationsEnabled(!next);
    });
  }

  function handleDisconnect() {
    if (!pairId || !partnerUid) return;
    Alert.alert('연결을 해제할까요?', `${partnerNickname}님과의 연결이 끊어져요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '연결 해제',
        style: 'destructive',
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          if (!uid) return;
          setDisconnecting(true);
          try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'users', uid), { pairId: null });
            batch.update(doc(db, 'users', partnerUid), { pairId: null });
            await batch.commit();
            await clearPartnerStatus();
            navigation.reset({ index: 0, routes: [{ name: 'HomeSolo' }] });
          } catch {
            Alert.alert('연결 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
          } finally {
            setDisconnecting(false);
          }
        },
      },
    ]);
  }

  function handleLogout() {
    Alert.alert('로그아웃 할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  if (nickname === null) {
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

      <View style={styles.row}>
        <Text style={styles.rowLabel}>알림</Text>
        <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
      </View>

      {pairId ? (
        <Row
          label="연결 해제"
          value={partnerNickname}
          danger
          disabled={disconnecting}
          onPress={handleDisconnect}
        />
      ) : null}

      <Row label="로그아웃" onPress={handleLogout} last />
    </ScreenContainer>
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
