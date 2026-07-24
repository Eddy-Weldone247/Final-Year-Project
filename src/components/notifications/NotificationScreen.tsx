import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { PressableScale } from '@/components/animations/PressableScale';
import { BellIcon, ChevronLeftIcon } from '@/components/icons';
import { type NotificationKind, useNotificationsStore } from '@/store/notificationsStore';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import { formatNotificationTime } from '@/utils/relativeTime';

import { NotificationCard, type NotificationItem, type NotificationTone } from './NotificationCard';

interface NotificationScreenProps {
  visible: boolean;
  onClose: () => void;
}

/** Maps a notification's source `kind` to its icon + tone (presentation only). */
const NOTIFICATION_META: Record<
  NotificationKind,
  { icon: keyof typeof Ionicons.glyphMap; tone: NotificationTone }
> = {
  welcome: { icon: 'sparkles-outline', tone: 'primary' },
  expense: { icon: 'checkmark-circle-outline', tone: 'success' },
  sms: { icon: 'swap-horizontal-outline', tone: 'accent' },
  'budget-warning': { icon: 'wallet-outline', tone: 'warning' },
  'budget-exceeded': { icon: 'alert-circle-outline', tone: 'danger' },
  prediction: { icon: 'trending-up-outline', tone: 'accent' },
  summary: { icon: 'document-text-outline', tone: 'primary' },
};

/**
 * Notification screen — a lightweight, glassmorphic empty state opened from the
 * Home bell. Purely presentational: no notification data or logic, just the
 * "all caught up" empty state. A static gradient (no animated loops) keeps it
 * cheap to mount/unmount; content fades in subtly. Light/dark auto via the auth
 * palette. Presented as a modal, so navigation is unchanged.
 */
export function NotificationScreen({ visible, onClose }: NotificationScreenProps) {
  const { isDark, c } = useAuthTheme();
  const stored = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);

  // Map the stored notifications (already newest-first) to the card's shape.
  const notifications = useMemo<NotificationItem[]>(
    () =>
      stored.map((n) => {
        const meta = NOTIFICATION_META[n.kind];
        return {
          id: n.id,
          icon: meta.icon,
          tone: meta.tone,
          title: n.title,
          description: n.message,
          timestamp: formatNotificationTime(n.createdAt),
          read: n.read,
        };
      }),
    [stored],
  );

  // Only render while open — the modal (and its native window) fully unmounts on
  // close, so Home stays instantly interactive behind it.
  if (!visible) return null;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      {/* A Modal is its own native window, so it needs its own inset provider
          (seeded with initialWindowMetrics) to get correct safe areas on the
          first frame — otherwise the header would overlap the status bar. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {/* Keep status-bar icons legible against the modal's gradient. */}
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
          <LinearGradient
            colors={c.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <PressableScale
                onPress={onClose}
                accessibilityLabel="Close"
                style={[styles.backShadow, { shadowColor: c.glow }]}
              >
                <BlurView
                  intensity={c.blurIntensity}
                  tint={c.blurTint}
                  experimentalBlurMethod="dimezisBlurView"
                  style={styles.backClip}
                >
                  <View
                    style={[
                      styles.back,
                      { backgroundColor: c.glassBg, borderColor: c.glassBorder },
                    ]}
                  >
                    <ChevronLeftIcon color={c.text} size={22} />
                  </View>
                </BlurView>
              </PressableScale>
              <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
            </Animated.View>

            {/* Notification list — or the empty state when there are none. */}
            {notifications.length === 0 ? (
              <View style={styles.body}>
                <Animated.View
                  entering={FadeInDown.duration(600).springify().damping(15)}
                  style={[styles.halo, { backgroundColor: c.primary + '14' }]}
                >
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor: c.glassBg,
                        borderColor: c.glassBorder,
                        shadowColor: c.glow,
                      },
                    ]}
                  >
                    <View
                      pointerEvents="none"
                      style={[styles.circleHighlight, { backgroundColor: c.glassHighlight }]}
                    />
                    <BellIcon size={40} color={c.primary} />
                  </View>
                </Animated.View>

                <Animated.Text
                  entering={FadeInDown.duration(600).delay(120)}
                  style={[styles.headline, { color: c.text }]}
                >
                  No Notifications Yet
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.duration(600).delay(200)}
                  style={[styles.description, { color: c.textMuted }]}
                >
                  You&apos;re all caught up.{'\n'}Alerts and reminders will appear here when
                  available.
                </Animated.Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {notifications.map((n, i) => (
                  <NotificationCard key={n.id} notification={n} delay={i * 60} onPress={markRead} />
                ))}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  backShadow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  backClip: { borderRadius: 14, overflow: 'hidden' },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fontFamily.bold, fontSize: 24 },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  halo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Soft neumorphic lift.
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  circleHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.7,
  },
  headline: { fontFamily: fontFamily.bold, fontSize: 21, textAlign: 'center' },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
  },
});
