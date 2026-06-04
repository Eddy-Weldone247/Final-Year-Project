import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useChangePassword } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import type { ProfileStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const changePassword = useChangePassword();

  const passwordsMatch = newPassword === confirmPassword;
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
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Change password</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter your current and new password
          </Text>
        </View>

        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <TextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          error={
            confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined
          }
        />

        <Button
          title="Change password"
          onPress={handleSave}
          loading={changePassword.isPending}
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
