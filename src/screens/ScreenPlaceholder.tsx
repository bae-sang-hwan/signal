import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export function ScreenPlaceholder({ title, num }: { title: string; num: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.num}>{num}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  num: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.faint,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.ink,
  },
});
