import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlassButton } from '@/components/buttons/GlassButton';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { MailIcon, UserIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { useUpdateProfile } from '@/hooks/useProfile';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { UpdateProfilePayload } from '@/types/auth';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function EditProfileScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const updateProfile = useUpdateProfile();

  const nameChanged = name.trim() !== user?.name;
  const emailChanged = email.trim().toLowerCase() !== user?.email;
  const emailValid = isValidEmail(email);
  const emailError = email.length > 0 && !emailValid ? 'Enter a valid email address' : null;
  const canSubmit = name.trim().length >= 2 && emailValid && (nameChanged || emailChanged);

  const handleSave = () => {
    const payload: UpdateProfilePayload = {};
    if (nameChanged) payload.name = name.trim();
    if (emailChanged) payload.email = email.trim();

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
    <AuthLayout center={false} onBack={() => navigation.goBack()}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Edit profile</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>Update your account details</Text>
      </View>

      <GlassCard delay={80}>
        <View style={styles.form}>
          <FloatingLabelInput
            label="Full name"
            value={name}
            onChangeText={setName}
            icon={<UserIcon color={c.inputIcon} />}
            autoCapitalize="words"
            autoComplete="name"
            success={name.trim().length >= 2}
          />
          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            icon={<MailIcon color={c.inputIcon} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={emailError}
            success={emailValid}
          />
          <GradientButton
            title="Save changes"
            onPress={handleSave}
            loading={updateProfile.isPending}
            disabled={!canSubmit}
          />
          <GlassButton title="Cancel" onPress={() => navigation.goBack()} />
        </View>
      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontFamily: fontFamily.regular },
  form: { gap: 16 },
});
