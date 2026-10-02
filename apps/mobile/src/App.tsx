import { t, setLocale } from '@suraksha/shared';
import React, { useEffect, useState } from 'react';
import { isDeviceInteraction, setDeviceRelock } from './lib/device-interaction';
import { File, Paths } from 'expo-file-system';
import { AppState, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import type { SafeUser } from '@suraksha/types';
import { SessionContext } from './lib/context';
import { restoreSession, setSessionExpiredHandler } from './lib/api';
import { OnboardingScreen, DisguiseUtility } from './features/onboarding';
import { SafetyScreen } from './features/safety';
import { EvidenceScreen } from './features/evidence';
import { ReportingScreen } from './features/reporting';
import { WellbeingScreen } from './features/wellbeing';
import { State, Page } from './components/ui';
const Stack = createNativeStackNavigator();
import { queryClient } from './lib/query-client';
export default function App() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [locked, setLocked] = useState(true);
  const [ready, setReady] = useState(false);
  const [nic, setNic] = useState('');
  useEffect(() => {
    queryClient.clear();
  }, [user?.id]);
  useEffect(() => {
    setLocale(user?.locale || 'en');
  }, [user?.locale]);
  useEffect(() => {
    // Remove interrupted decrypted previews after a prior process termination.
    try {
      for (const item of Paths.cache.list())
        if (item instanceof File && /^(preview-|captured-)/.test(item.name)) item.delete();
    } catch {
      /* An unavailable OS cache must not prevent sign-in. */
    }
    setSessionExpiredHandler(() => {
      queryClient.clear();
      setUser(null);
      setLocked(true);
    });
    restoreSession()
      .then(setUser)
      .catch(() => {})
      .finally(() => setReady(true));
    setDeviceRelock(() => {
      setLocked(true);
      queryClient.clear();
    });
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && !isDeviceInteraction()) {
        setLocked(true);
        queryClient.clear();
      }
    });
    return () => {
      listener.remove();
      setSessionExpiredHandler(() => {});
      setDeviceRelock(() => {});
    };
  }, []);
  return (
    <SafeAreaProvider
      style={
        Platform.OS === 'web'
          ? { flex: 1, width: '100%', maxWidth: 460, height: '100%', marginHorizontal: 'auto' }
          : undefined
      }
    >
      <QueryClientProvider client={queryClient}>
        <SessionContext.Provider value={{ user, setUser, locked, setLocked, nic, setNic }}>
          {!ready ? (
            <Page title={t('Suraksha')}>
              <State query={{ isLoading: true, error: null }} />
            </Page>
          ) : user && locked && user.hasPin ? (
            <DisguiseUtility />
          ) : (
            <NavigationContainer key={user ? 'account' : 'guest'}>
              <Stack.Navigator
                initialRouteName={user ? (user.hasPin ? 'M12' : 'M08') : 'M01'}
                screenOptions={{ headerShown: false }}
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const id = 'M' + String(i + 1).padStart(2, '0');
                  const Component =
                    i < 11
                      ? OnboardingScreen
                      : i < 17
                        ? SafetyScreen
                        : i < 22
                          ? EvidenceScreen
                          : i < 28
                            ? ReportingScreen
                            : WellbeingScreen;
                  return <Stack.Screen key={id} name={id} component={Component} />;
                })}
              </Stack.Navigator>
            </NavigationContainer>
          )}
        </SessionContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
