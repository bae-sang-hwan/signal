import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { SignalDial } from '../components/SignalDial';
import { PrimaryButton } from '../components/PrimaryButton';
import { SettingsButton } from '../components/SettingsButton';
import { colors, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { nextSignalColor, resolveCaption, SignalCaptions, updateMyColor } from '../lib/signalCopy';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeSolo'>;

export function HomeSoloScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState<string | null>(null);
  const [color, setColor] = useState<SignalColor>('green');
  const [captions, setCaptions] = useState<Partial<SignalCaptions> | undefined>();

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
      if (data.currentColor) setColor(data.currentColor as SignalColor);
      setCaptions(data.captions as Partial<SignalCaptions> | undefined);
      if (data.pairId) {
        navigation.reset({ index: 0, routes: [{ name: 'HomeConnected' }] });
      }
    });
  }, [navigation]);

  function handleCyclePress() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const next = nextSignalColor(color);
    setColor(next);
    updateMyColor(uid, next).catch(() => {
      setColor(color);
    });
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
      <View style={styles.topRow}>
        <Text style={styles.greeting}>안녕, {nickname}</Text>
        <SettingsButton onPress={() => navigation.navigate('Settings')} />
      </View>

      <View style={styles.dialWrap}>
        <SignalDial color={color} onPress={handleCyclePress} />
        <Text style={styles.caption}>지금 상태: {resolveCaption(captions, color)}</Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>아직 연결된 사람이 없어요</Text>
        <Text style={styles.bannerDesc}>상대를 초대하면 서로의 상태가 보여요.</Text>
      </View>

      <PrimaryButton
        label="파트너 초대하기"
        variant="ghost"
        onPress={() => navigation.navigate('InviteCode')}
      />
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
    paddingBottom: 20,
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
  dialWrap: {
    alignItems: 'center',
    marginTop: 56,
  },
  caption: {
    marginTop: 18,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
  },
  banner: {
    marginTop: 'auto',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  bannerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  bannerDesc: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.muted,
  },
});
