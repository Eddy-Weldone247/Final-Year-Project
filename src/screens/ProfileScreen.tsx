import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useLogout } from '@/hooks/useAuth';
import { useProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useLogout();
  const { data } = useProfile();
  const uploadAvatar = useUploadAvatar();

  // Keep the store in sync with the freshly fetched profile.
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  if (!user) {
    return null;
  }

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
    if (result.canceled) {
      return;
    }
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

  return (
    <ScreenContainer>
      <FadeInView style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={handlePickImage} accessibilityRole="button" style={styles.avatarWrap}>
            <Avatar uri={user.avatarUrl} name={user.name} />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              {uploadAvatar.isPending ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.editBadgeText, { color: colors.onPrimary }]}>Edit</Text>
              )}
            </View>
          </Pressable>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
          <Text
            style={[
              styles.badge,
              user.isEmailVerified
                ? { backgroundColor: colors.verifiedBg, color: colors.verifiedText }
                : { backgroundColor: colors.unverifiedBg, color: colors.unverifiedText },
            ]}
          >
            {user.isEmailVerified ? '✓ Verified' : 'Unverified'}
          </Text>
        </View>

        <Button title="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <Button
          title="Change password"
          variant="ghost"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <Button title="Settings" variant="ghost" onPress={() => navigation.navigate('Settings')} />
        <Button title="Log out" variant="ghost" onPress={confirmLogout} />
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  header: { alignItems: 'center', gap: 6, marginBottom: 12 },
  avatarWrap: { marginBottom: 8 },
  editBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 12,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 3,
    position: 'absolute',
  },
  editBadgeText: { fontSize: 12, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 15 },
  badge: {
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
