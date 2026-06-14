import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlassButton } from '@/components/buttons/GlassButton';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { LockIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { PasswordStrength } from '@/components/inputs/PasswordStrength';
import { useChangePassword } from '@/hooks/useProfile';
import type { ProfileStackParamList } from '@/navigation/types';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const changePassword = useChangePassword();

  const passwordsMatch = newPassword === confirmPassword;
  const confirmError =
    confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : null;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && passwordsMatch;

  const handleSave = () => {
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (data) =>
          Alert.alert('Done', data.message, [{ text: 'OK', onPress: () => navigation.goBack() }]),
        onError: (error) => Alert.alert('Change failed', getErrorMessage(error)),
      },
    );
  };

  return (
    <AuthLayout center={false} onBack={() => navigation.goBack()}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Change password</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Enter your current and a new password
        </Text>
      </View>

      <GlassCard delay={80}>
        <View style={styles.form}>
          <FloatingLabelInput
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            icon={<LockIcon color={c.inputIcon} />}
            secure
            autoCapitalize="none"
            textContentType="password"
          />
          <FloatingLabelInput
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            icon={<LockIcon color={c.inputIcon} />}
            secure
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <PasswordStrength password={newPassword} />
          <FloatingLabelInput
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon={<LockIcon color={c.inputIcon} />}
            secure
            autoCapitalize="none"
            error={confirmError}
            success={confirmPassword.length > 0 && passwordsMatch}
          />
          <GradientButton
            title="Change password"
            onPress={handleSave}
            loading={changePassword.isPending}
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
