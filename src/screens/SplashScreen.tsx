import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { registerFcmToken } from '../lib/fcm';
import { BrandMark } from '../components/BrandMark';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      registerFcmToken(user.uid).catch(() => {});

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        navigation.reset({ index: 0, routes: [{ name: 'Nickname' }] });
        return;
      }
      const data = snap.data();
      navigation.reset({
        index: 0,
        routes: [{ name: data?.pairId ? 'HomeConnected' : 'HomeSolo' }],
      });
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <BrandMark size={68} />
      <Text style={styles.title}>시그널</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 19,
    color: colors.ink,
  },
});
