import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, signalColorMap, SignalColor } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { auth, db } from '../lib/firebase';
import { defaultSignalCaptions, signalOrder } from '../lib/signalCopy';

const CAPTION_MAX_LEN = 20;

const colorName: Record<SignalColor, string> = {
  red: '빨강',
  amber: '노랑',
  green: '초록',
};

type Props = NativeStackScreenProps<RootStackParamList, 'ColorCaptions'>;

export function ColorCaptionsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<SignalColor, string>>({
    red: '',
    amber: '',
    green: '',
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    getDoc(doc(db, 'users', uid)).then((snap) => {
      const captions = snap.data()?.captions as Partial<Record<SignalColor, string>> | undefined;
      setDrafts({
        red: captions?.red ?? '',
        amber: captions?.amber ?? '',
        green: captions?.green ?? '',
      });
      setLoading(false);
    });
  }, [navigation]);

  async function handleSave() {
    const uid = auth.currentUser?.uid;
    if (!uid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', uid), {
        captions: {
          red: drafts.red.trim(),
          amber: drafts.amber.trim(),
          green: drafts.green.trim(),
        },
      });
      navigation.goBack();
    } catch {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer style={styles.content}>
        <Text style={styles.title}>색상 문구 편집</Text>
        <Text style={styles.desc}>
          각 색이 무슨 뜻인지 둘만의 표현으로 바꿔보세요. 비워두면 기본 문구가 쓰여요.
        </Text>

        {signalOrder.map((c) => (
          <View key={c} style={styles.field}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: signalColorMap[c] }]} />
              <Text style={styles.label}>{colorName[c]}</Text>
            </View>
            <TextInput
              value={drafts[c]}
              onChangeText={(t) => setDrafts((d) => ({ ...d, [c]: t }))}
              placeholder={defaultSignalCaptions[c]}
              placeholderTextColor={colors.faint}
              maxLength={CAPTION_MAX_LEN}
              style={styles.input}
            />
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.btnWrap}>
          <PrimaryButton label="저장" onPress={handleSave} loading={saving} />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  field: {
    marginTop: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.red,
    marginTop: 16,
  },
  btnWrap: {
    marginTop: 32,
  },
});
