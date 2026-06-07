import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'expensee-remember-email';

/** Persists the last-used email when "Remember me" is enabled, and prefills it. */
export function useRememberedEmail() {
  const [initialEmail, setInitialEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (value) {
          setInitialEmail(value);
          setRemember(true);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(
    async (email: string) => {
      if (remember && email.trim()) {
        await AsyncStorage.setItem(KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(KEY);
      }
    },
    [remember],
  );

  return { initialEmail, remember, setRemember, persist, loaded };
}
