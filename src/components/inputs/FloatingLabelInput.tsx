import { forwardRef, type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

const REST_TOP = 20;
const FLOAT_TOP = 9;

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  success?: boolean;
  /** Renders a password visibility toggle and masks input by default. */
  secure?: boolean;
}

export const FloatingLabelInput = forwardRef<TextInput, FloatingLabelInputProps>(
  function FloatingLabelInput(
    {
      label,
      icon,
      error,
      success = false,
      secure = false,
      value,
      onFocus,
      onBlur,
      style,
      ...props
    },
    ref,
  ) {
    const { c } = useAuthTheme();
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(secure);

    const focus = useSharedValue(0);
    const active = useSharedValue(value ? 1 : 0);

    const hasValue = !!value && String(value).length > 0;
    useEffect(() => {
      active.value = withTiming(focused || hasValue ? 1 : 0, { duration: 180 });
    }, [focused, hasValue, active]);
    useEffect(() => {
      focus.value = withTiming(focused ? 1 : 0, { duration: 180 });
    }, [focused, focus]);

    const boxStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(focus.value, [0, 1], [c.inputBorder, c.primary]),
      shadowOpacity: focus.value * 0.35,
    }));

    const labelStyle = useAnimatedStyle(() => ({
      top: interpolate(active.value, [0, 1], [REST_TOP, FLOAT_TOP]),
      fontSize: interpolate(active.value, [0, 1], [16, 12]),
    }));

    const stateBorder = error
      ? { borderColor: c.danger }
      : success
        ? { borderColor: c.success }
        : null;

    const labelColor = error ? c.danger : focused ? c.primary : success ? c.success : c.textMuted;

    return (
      <View>
        <Animated.View
          style={[
            styles.box,
            { backgroundColor: c.inputBg, shadowColor: c.primary },
            boxStyle,
            stateBorder,
          ]}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}

          <Animated.Text
            pointerEvents="none"
            style={[styles.label, { left: icon ? 52 : 18, color: labelColor }, labelStyle]}
          >
            {label}
          </Animated.Text>

          <TextInput
            ref={ref}
            value={value}
            style={[styles.input, { color: c.text, paddingLeft: icon ? 52 : 18 }, style]}
            placeholderTextColor={c.textFaint}
            secureTextEntry={secure ? hidden : props.secureTextEntry}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />

          {secure ? (
            <Pressable
              hitSlop={10}
              onPress={() => setHidden((h) => !h)}
              style={styles.accessory}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            >
              {hidden ? (
                <EyeIcon color={c.inputIcon} size={22} />
              ) : (
                <EyeOffIcon color={c.primary} size={22} />
              )}
            </Pressable>
          ) : success ? (
            <View style={styles.accessory}>
              <CheckIcon color={c.success} size={20} />
            </View>
          ) : null}
        </Animated.View>

        {error ? (
          <Animated.Text
            entering={FadeInDown.duration(220)}
            style={[styles.error, { color: c.danger }]}
          >
            {error}
          </Animated.Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  box: {
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
  },
  icon: { position: 'absolute', left: 16, top: 20, width: 24, alignItems: 'center' },
  label: { position: 'absolute', fontFamily: fontFamily.medium },
  input: {
    height: 62,
    paddingTop: 24,
    paddingBottom: 8,
    paddingRight: 36,
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  accessory: { position: 'absolute', right: 14, top: 20 },
  error: { marginTop: 6, marginLeft: 4, fontSize: 13, fontFamily: fontFamily.medium },
});
