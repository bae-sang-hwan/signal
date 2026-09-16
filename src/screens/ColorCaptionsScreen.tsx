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
import { signalOrder } from '../lib/signalCopy';
import { useTranslation } from '../i18n';

const CAPTION_MAX_LEN = 20;

type Props = NativeStackScreenProps<RootStackParamList, 'ColorCaptions'>;

export function ColorCaptionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
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
      setError(t('colorCaptions.errorSave'));
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
        <Text style={styles.title}>{t('colorCaptions.title')}</Text>
        <Text style={styles.desc}>{t('colorCaptions.desc')}</Text>

        {signalOrder.map((c) => (
          <View key={c} style={styles.field}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: signalColorMap[c] }]} />
              <Text style={styles.label}>{t(`colorCaptions.${c}`)}</Text>
            </View>
            <TextInput
              value={drafts[c]}
              onChangeText={(next) => setDrafts((d) => ({ ...d, [c]: next }))}
              placeholder={t(`signalCaptions.${c}`)}
              placeholderTextColor={colors.faint}
              maxLength={CAPTION_MAX_LEN}
              style={styles.input}
            />
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.btnWrap}>
          <PrimaryButton label={t('colorCaptions.save')} onPress={handleSave} loading={saving} />
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
