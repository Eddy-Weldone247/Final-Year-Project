import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/hooks/useTheme';
import { useUpdateProfile } from '@/hooks/useProfile';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import type { UpdateProfilePayload } from '@/types/auth';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const updateProfile = useUpdateProfile();

  const nameChanged = name.trim() !== user?.name;
  const emailChanged = email.trim().toLowerCase() !== user?.email;
  const canSubmit =
    name.trim().length >= 2 && email.trim().length > 0 && (nameChanged || emailChanged);

  const handleSave = () => {
    const payload: UpdateProfilePayload = {};
    if (nameChanged) {
      payload.name = name.trim();
    }
    if (emailChanged) {
      payload.email = email.trim();
    }

    updateProfile.mutate(payload, {
      onSuccess: () =>
        Alert.alert(
          'Profile updated',
          emailChanged
            ? 'Verify your new email address to keep full access.'
            : 'Your profile has been updated.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        ),
      onError: (error) => Alert.alert('Update failed', getErrorMessage(error)),
    });
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Edit profile</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Update your account details
          </Text>
        </View>

        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Button
          title="Save changes"
          onPress={handleSave}
          loading={updateProfile.isPending}
          disabled={!canSubmit}
        />
        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
});
