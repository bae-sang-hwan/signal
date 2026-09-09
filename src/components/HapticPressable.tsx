import { forwardRef } from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export const HapticPressable = forwardRef<typeof Pressable, PressableProps>(
  function HapticPressable({ onPressIn, ...props }, ref) {
    return (
      <Pressable
        {...props}
        ref={ref as any}
        onPressIn={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn?.(e);
        }}
      />
    );
  },
);
