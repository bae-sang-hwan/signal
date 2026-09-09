import { useRef } from 'react';
import { KeyboardTypeOptions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export function CodeBoxInput({
  length,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'characters',
  editable = true,
  autoFocus = true,
}: {
  length: number;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'characters';
  editable?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  return (
    <>
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[styles.box, i === value.length && editable && styles.boxActive]}
          >
            <Text style={styles.boxText}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        editable={editable}
        style={styles.hiddenInput}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  box: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.ink,
  },
  boxText: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.ink,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
