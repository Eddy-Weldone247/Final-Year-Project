import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

/** Amber for the "warning" tone (the auth palette has no warning token). */
const AMBER = '#F59E0B';

export type NotificationTone = 'primary' | 'success' | 'accent' | 'warning' | 'danger';

/** A single notification's presentational data (static — no logic/generation). */
export interface NotificationItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: NotificationTone;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

function toneColor(tone: NotificationTone, c: AuthPalette): string {
  switch (tone) {
    case 'primary':
      return c.primary;
    case 'success':
      return c.success;
    case 'accent':
      return c.accent;
    case 'warning':
      return AMBER;
    case 'danger':
      return c.danger;
  }
}

interface NotificationCardProps {
  notification: NotificationItem;
  /** Entrance stagger delay (ms). */
  delay?: number;
  /** Tapping the card marks it read. */
  onPress?: (id: string) => void;
}

/**
 * A reusable glassmorphic notification card: tone-tinted icon, title,
 * description, timestamp, and a read/unread state. Unread cards show a small
 * coloured indicator + a slightly stronger title; tapping marks the card read,
 * fading the indicator and dimming the card smoothly.
 */
export const NotificationCard = memo(function NotificationCard({
  notification,
  delay = 0,
  onPress,
}: NotificationCardProps) {
  const { c } = useAuthTheme();
  const color = toneColor(notification.tone, c);
  const unread = !notification.read;

  // Smoothly dim the card when it transitions unread → read.
  const readStyle = useAnimatedStyle(() => ({
    opacity: withTiming(unread ? 1 : 0.72, { duration: 260 }),
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay).springify().damping(18)}
      style={styles.wrap}
    >
      <PressableScale
        onPress={() => onPress?.(notification.id)}
        accessibilityLabel={`${notification.title}. ${unread ? 'Unread' : 'Read'}`}
      >
        <Animated.View
          style={[
            styles.card,
            readStyle,
            {
              backgroundColor: c.glassBg,
              borderColor: unread ? color + '55' : c.glassBorder,
              shadowColor: c.glow,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.icon, { backgroundColor: color + '22', borderColor: color + '4D' }]}>
            <Ionicons name={notification.icon} size={20} color={color} />
          </View>

          {/* Body */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: c.text, fontFamily: unread ? fontFamily.bold : fontFamily.semibold },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {unread ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(220)}
                  style={[styles.dot, { backgroundColor: color }]}
                />
              ) : null}
            </View>
            <Text style={[styles.description, { color: c.textMuted }]} numberOfLines={2}>
              {notification.description}
            </Text>
            <Text style={[styles.timestamp, { color: c.textFaint }]}>{notification.timestamp}</Text>
          </View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    // Subtle themed lift, consistent with the app's glass cards.
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  description: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  timestamp: { fontFamily: fontFamily.medium, fontSize: 11.5, marginTop: 2 },
});
