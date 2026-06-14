import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/cards/GlassCard';
import {
  ChevronRightIcon,
  LockIcon,
  LogOutIcon,
  PencilIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/icons';
import { useLogout } from '@/hooks/useAuth';
import { useProfile, useUploadAvatar } from '@/hooks/useProfile';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

const AMBER = '#F59E0B';
const ROW_INSET = 40 + spacing.md; // icon width + gap → divider start

function ProfileRow({
  icon,
  color,
  label,
  onPress,
  c,
  last,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  onPress: () => void;
  c: AuthPalette;
  last?: boolean;
}) {
  return (
    <>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        style={styles.row}
        accessibilityLabel={label}
      >
        <View style={[styles.rowIcon, { backgroundColor: `${color}22` }]}>{icon}</View>
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
        <ChevronRightIcon size={20} color={c.textFaint} />
      </PressableScale>
      {!last ? (
        <View style={[styles.divider, { backgroundColor: c.glassBorder, marginLeft: ROW_INSET }]} />
      ) : null}
    </>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useLogout();
  const { data } = useProfile();
  const uploadAvatar = useUploadAvatar();

  // Keep the store in sync with the freshly fetched profile.
  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  if (!user) return null;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    uploadAvatar.mutate(
      { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
      { onError: (error) => Alert.alert('Upload failed', getErrorMessage(error)) },
    );
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const verified = user.isEmailVerified;

  return (
    <AuthLayout center={false}>
      <Animated.Text entering={FadeIn.duration(450)} style={[styles.title, { color: c.text }]}>
        Profile
      </Animated.Text>

      {/* Profile header */}
      <GlassCard delay={60} style={styles.card}>
        <View style={styles.profile}>
          <Pressable onPress={handlePickImage} accessibilityRole="button" style={styles.avatarWrap}>
            <Avatar uri={user.avatarUrl} name={user.name} size={96} />
            <View
              style={[styles.editBadge, { backgroundColor: c.primary, borderColor: c.glassBg }]}
            >
              {uploadAvatar.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <PencilIcon size={13} color="#fff" />
              )}
            </View>
          </Pressable>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.email, { color: c.textMuted }]} numberOfLines={1}>
            {user.email}
          </Text>
          <View
            style={[styles.badge, { backgroundColor: verified ? `${c.success}22` : `${AMBER}22` }]}
          >
            <Text style={[styles.badgeText, { color: verified ? c.success : AMBER }]}>
              {verified ? '✓ Verified' : 'Unverified'}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Account actions */}
      <Text style={[styles.section, { color: c.textFaint }]}>ACCOUNT</Text>
      <GlassCard delay={100} style={styles.card}>
        <ProfileRow
          icon={<UserIcon size={20} color={c.primary} />}
          color={c.primary}
          label="Edit profile"
          onPress={() => navigation.navigate('EditProfile')}
          c={c}
        />
        <ProfileRow
          icon={<LockIcon size={20} color={c.accent} />}
          color={c.accent}
          label="Change password"
          onPress={() => navigation.navigate('ChangePassword')}
          c={c}
        />
        <ProfileRow
          icon={<SettingsIcon size={20} color={c.secondary} />}
          color={c.secondary}
          label="Settings"
          onPress={() => navigation.navigate('Settings')}
          c={c}
          last
        />
      </GlassCard>

      {/* Log out */}
      <GlassCard delay={140}>
        <PressableScale
          onPress={confirmLogout}
          scaleTo={0.98}
          style={styles.row}
          accessibilityLabel="Log out"
        >
          <View style={[styles.rowIcon, { backgroundColor: `${c.danger}22` }]}>
            <LogOutIcon size={20} color={c.danger} />
          </View>
          <Text style={[styles.rowLabel, { color: c.danger }]}>Log out</Text>
        </PressableScale>
      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.4,
    marginBottom: spacing.xl,
  },
  card: { marginBottom: spacing.lg },
  section: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },

  // Header
  profile: { alignItems: 'center' },
  avatarWrap: { marginBottom: spacing.lg },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontFamily: fontFamily.bold, letterSpacing: -0.3 },
  email: { fontSize: 15, fontFamily: fontFamily.regular, marginTop: spacing.xs },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  badgeText: { fontSize: 12, fontFamily: fontFamily.bold, letterSpacing: 0.3 },

  // Rows
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: fontFamily.semibold },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.7 },
});
