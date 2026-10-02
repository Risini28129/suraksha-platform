import { deviceNotifications } from '../providers/notifications';
import { disguiseProvider } from '../providers/disguise';
import { t } from '@suraksha/shared';
import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, saveSession, signOut } from '../lib/api';
import { useSession, ScreenProps } from '../lib/context';
import {
  Page,
  Icon,
  Card,
  Button,
  Choice,
  Dots,
  Input,
  PinPad,
  Trust,
  TrustBadges,
  ShieldMark,
  Stepper,
  SegmentedControl,
  PasswordStrength,
  colors,
  s,
} from '../components/ui';
export function DisguiseUtility() {
  const session = useSession();
  const [guardian, setGuardian] = useState(false);
  const [pin, setPin] = useState('');
  const [display, setDisplay] = useState('0');
  const [operand, setOperand] = useState<number | null>(null);
  const [op, setOp] = useState('');
  const [note, setNote] = useState('');
  const disguise = session.user?.disguise || 'calculator';
  if (guardian)
    return (
      <Page
        title={t('Guardian mode')}
        subtitle={t('Enter your private PIN to open Suraksha')}
        tag="APP LOCK"
      >
        <View style={{ backgroundColor: colors.navy, borderRadius: 25, padding: 24 }}>
          <Text style={s.hero}>{t('\u2662')}</Text>
          <PinPad label={t('6-digit PIN')} value={pin} onChange={setPin} />
          <Dots step={Math.min(pin.length, 6)} total={6} />
          <Button
            title={t('Continue to Suraksha')}
            onPress={async () => {
              await api('/me/security/unlock', 'POST', { pin });
              session.setLocked(false);
              setPin('');
            }}
          />
          <Button
            title={'Back to ' + disguise}
            tone="outline"
            onPress={() => {
              setGuardian(false);
              setPin('');
            }}
          />
          {session.user?.biometricEnabled && (
            <Button
              title={t('Use biometric unlock')}
              onPress={async () => {
                const result = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Unlock Suraksha',
                  disableDeviceFallback: true,
                });
                if (result.success) session.setLocked(false);
                else throw new Error('Biometric unlock was not completed');
              }}
            />
          )}
        </View>
      </Page>
    );
  return (
    <Page
      title={disguise === 'calculator' ? 'Calculator' : disguise === 'notes' ? 'Notes' : 'Weather'}
      discreet
    >
      <Pressable
        accessibilityLabel={t('Open private PIN entry')}
        onLongPress={() => setGuardian(true)}
        delayLongPress={1500}
      >
        <Text style={[s.text, { textAlign: 'right', fontSize: 38, marginVertical: 40 }]}>
          {disguise === 'calculator'
            ? display
            : disguise === 'notes'
              ? 'My notes'
              : 'Forecast unavailable'}
        </Text>
      </Pressable>
      {disguise === 'notes' ? (
        <Input label={t('Note')} value={note} onChange={setNote} multiline />
      ) : disguise === 'calculator' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['7', '8', '9', '+', '4', '5', '6', '−', '1', '2', '3', '×', 'C', '0', '=', '÷'].map(
            (key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key}
                style={[s.card, { width: '22%', alignItems: 'center' }]}
                onPress={() => {
                  if (key === 'C') {
                    setDisplay('0');
                    setOperand(null);
                    setOp('');
                  } else if (['+', '−', '×', '÷'].includes(key)) {
                    setOperand(Number(display));
                    setOp(key);
                    setDisplay('0');
                  } else if (key === '=') {
                    if (operand !== null) {
                      const n = Number(display);
                      setDisplay(
                        String(
                          op === '+'
                            ? operand + n
                            : op === '−'
                              ? operand - n
                              : op === '×'
                                ? operand * n
                                : n
                                  ? operand / n
                                  : 'Error',
                        ),
                      );
                      setOperand(null);
                    }
                  } else setDisplay((v) => (v === '0' ? key : (v + key).slice(0, 14)));
                }}
              >
                <Text style={s.text}>{key}</Text>
              </Pressable>
            ),
          )}
        </View>
      ) : null}
    </Page>
  );
}
export function OnboardingScreen({ navigation: n, route }: ScreenProps) {
  const id = route.name;
  const session = useSession();
  const [form, setForm] = useState({ login: '', phone: '', name: '', password: '' });
  const [register, setRegister] = useState(false);
  const [consent, setConsent] = useState(false);
  const [locale, setLocale] = useState('en');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [biometric, setBiometric] = useState(false);
  const [disguise, setDisguise] = useState(session.user?.disguise || 'calculator');
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [preferenceError, setPreferenceError] = useState('');
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  if (id === 'M01')
    return (
      <Page title="" tag="WELCOME TO YOUR SAFE SPACE">
        <View
          style={{
            backgroundColor: colors.navy,
            borderRadius: 30,
            padding: 28,
            minHeight: 330,
            justifyContent: 'center',
            marginTop: 6,
            marginBottom: 26,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 230,
              height: 230,
              borderWidth: 1,
              borderColor: '#ffffff18',
              borderRadius: 115,
              right: -65,
              top: -50,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 290,
              height: 290,
              borderWidth: 1,
              borderColor: '#ffffff12',
              borderRadius: 145,
              right: -95,
              top: -80,
            }}
          />
          <View
            style={{
              backgroundColor: '#ffffff14',
              borderWidth: 1,
              borderColor: '#ffffff22',
              borderRadius: 24,
              width: 92,
              height: 92,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 34,
            }}
          >
            <Icon name="shield" size={52} color="#5be0b0" />
          </View>
          <Text
            style={{
              color: 'white',
              fontSize: 37,
              fontWeight: '800',
              lineHeight: 44,
              letterSpacing: -1.2,
            }}
          >
            You deserve{'\n'}to feel safe.
          </Text>
          <Text style={{ color: '#cbdcf3', fontSize: 14, lineHeight: 23, marginTop: 15 }}>
            A private place to find support, protect your story and take your next step.
          </Text>
        </View>
        <Text style={[s.title, { fontSize: 25 }]}>Together, a little stronger.</Text>
        <Text style={s.subtitle}>Safety, guidance and care. All in one place, at your pace.</Text>
        <View style={[s.row, { marginBottom: 22 }]}>
          {(
            [
              ['shield', 'Stay safe'],
              ['lock', 'Keep it private'],
              ['heart', 'Find support'],
            ] as const
          ).map(([icon, label]) => (
            <View key={label} style={{ flex: 1, alignItems: 'center', gap: 9 }}>
              <View
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 16,
                  padding: 13,
                }}
              >
                <Icon name={icon} color={colors.green} />
              </View>
              <Text style={[s.muted, { fontSize: 11 }]}>{label}</Text>
            </View>
          ))}
        </View>
        <Button title={t('GET STARTED \u276F')} onPress={() => n.navigate('M02')} />
        <Trust text="YOUR CHOICE | YOUR PACE | YOUR SPACE" />
      </Page>
    );
  if (id === 'M02')
    return (
      <Page
        title={t('Welcome back')}
        tag="SECURE LOGIN"
        meta="SAFETY NETWORK"
        subtitle={t('Your private space is ready when you are.')}
      >
        <ShieldMark size={56} />

        <SegmentedControl
          options={[t('Log In'), t('Register')]}
          value={register ? t('Register') : t('Log In')}
          onChange={(v) => setRegister(v === t('Register'))}
        />
        <Input
          label={t('NIC NUMBER')}
          icon="▣"
          value={form.login}
          onChange={(login) => setForm({ ...form, login })}
        />
        {!register && (
          <Input
            label={t('PASSWORD')}
            icon="▢"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            secure
            revealable
          />
        )}
        <Button
          title={t('Continue \u276F')}
          onPress={async () => {
            if (register) {
              if (!/^(?:\d{12}|\d{9}[vVxX])$/.test(form.login.trim()))
                throw new Error('Enter a valid NIC: 12 digits, or 9 digits followed by V or X.');
              session.setNic(form.login.trim());
              n.navigate('M03');
              return;
            }
            if (!form.login.trim() || !form.password)
              throw new Error('Enter your NIC and password to continue.');
            const result = await api('/auth/login', 'POST', {
              login: form.login.trim(),
              password: form.password,
            });
            if (result.user.role !== 'USER') throw new Error('Staff accounts use the web console');
            await saveSession(result);
            session.setUser(result.user);
            session.setLocked(true);
          }}
        />
        <Pressable onPress={() => setRegister(true)}>
          <Text style={s.link}>
            {t('New here?')}{' '}
            <Text style={{ color: colors.blue }}>{t('Register with your NIC')}</Text>{' '}
            {t('in one step.')}
          </Text>
        </Pressable>
        <TrustBadges />
      </Page>
    );
  if (id === 'M03')
    return (
      <Page
        title={t('Choose your language')}
        tag="QUICK SETUP"
        meta="LANGUAGE"
        subtitle={t('SINHALA \u00B7 TAMIL \u00B7 ENGLISH')}
      >
        <Stepper step={1} total={4} label={t('Language')} />
        <Text style={[s.hero, { fontSize: 48 }]}>○</Text>
        {[
          ['si', 'Sinhala · සිංහල', 'SI'],
          ['ta', 'Tamil · தமிழ்', 'TA'],
          ['en', 'English', 'EN'],
        ].map(([code, label, badge]) => (
          <Choice
            key={code}
            label={`${badge}  ${label}`}
            selected={locale === code}
            onPress={() => setLocale(code!)}
          />
        ))}
        {locale !== 'en' && (
          <Text style={s.muted}>
            {t('Verified translations are not supplied. English content will be shown.')}
          </Text>
        )}
        <Text style={s.muted}>{t('You can change this anytime in Settings.')}</Text>
        <Button
          title={t('Continue \u276F')}
          onPress={async () => {
            if (session.user) {
              const u = await api('/me/preferences', 'PATCH', { locale });
              session.setUser(u);
              n.goBack();
            } else n.navigate('M04', { locale });
          }}
        />
        <TrustBadges />
      </Page>
    );
  if (['M04', 'M05', 'M06'].includes(id)) {
    const index = Number(id.slice(1)) - 4;
    const titles = [
      'One tap. Instant help.',
      'Your evidence, encrypted.',
      'Always someone watching over you.',
    ];
    const descriptions = [
      'One deliberate action shares your live location with trusted contacts and the nearest verified responder when delivery is connected.',
      'Screenshots, audio and location stay encrypted and hidden from other people using the same phone.',
      'Verified responders and support staff stay ready across reporting, legal guidance and counseling.',
    ];
    return (
      <Page title={t('')} tag="ONBOARDING" meta={`STEP ${index + 1} OF 3`}>
        <Pressable onPress={() => n.navigate('M07', route.params)}>
          <Text style={[s.link, { textAlign: 'right' }]}>{t('Skip')}</Text>
        </Pressable>
        <ShieldMark size={64} />
        <Text style={s.title}>{titles[index]}</Text>
        <Text style={s.subtitle}>{descriptions[index]}</Text>
        <Dots step={index + 1} />
        <Text style={[s.muted, { textAlign: 'center' }]}>
          {t('Research prototype · development delivery services')}
        </Text>
        <Button
          title={id === 'M06' ? 'Get started ❯' : 'Next ❯'}
          onPress={() =>
            n.navigate(id === 'M06' ? 'M07' : id === 'M04' ? 'M05' : 'M06', route.params)
          }
        />
      </Page>
    );
  }
  if (id === 'M07')
    return (
      <Page
        title={t('Create your account')}
        tag="SECURE SIGNUP"
        meta="ACCOUNT"
        subtitle={t('TAKES LESS THAN A MINUTE')}
      >
        <Stepper step={3} total={5} label={t('Account setup')} />
        <Input
          label={t('FULL NAME')}
          icon="♙"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
        />
        <Input
          label={t('MOBILE NUMBER')}
          icon="☎"
          value={form.phone}
          onChange={(phone) => setForm({ ...form, phone })}
          keyboardType="phone-pad"
        />
        <Input
          label={t('PASSWORD')}
          icon="▢"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          secure
          revealable
        />
        <PasswordStrength value={form.password} />
        <Text style={s.muted}>{t('Use 8+ characters with a number & symbol.')}</Text>
        <Choice
          label={t('I agree to the Terms and Privacy Policy and confirm I am 16 or older.')}
          selected={consent}
          onPress={() => setConsent(!consent)}
        />
        <Text style={s.muted}>
          {t(
            'Reviewed Terms and Privacy Policy text is not yet supplied for this research prototype. Do not enter real sensitive data in development.',
          )}
        </Text>
        <Button
          title={t('Create account')}
          onPress={async () => {
            if (!consent) throw new Error('Please confirm the consent checkbox to continue.');
            const result = await api('/auth/register', 'POST', {
              name: form.name,
              phone: form.phone,
              password: form.password,
              nic: session.nic,
              consent,
            });
            await saveSession(result);
            session.setUser(result.user);
            session.setLocked(false);
            session.setUser(
              await api('/me/preferences', 'PATCH', { locale: route.params?.locale || 'en' }),
            );
          }}
        />
        <Button
          title={t('Already have an account? Sign in')}
          tone="outline"
          onPress={() => n.navigate('M02')}
        />
        <TrustBadges />
      </Page>
    );
  if (id === 'M08')
    return (
      <Page
        title={t('Secure your app')}
        tag="APP LOCK"
        meta="PIN SETUP"
        subtitle={t('Set a 6-digit PIN. You can also enable fingerprint unlock.')}
      >
        <Stepper step={4} total={5} label={t('App lock')} />
        {session.user?.hasPin && (
          <Input
            label={t('Current PIN')}
            value={currentPin}
            onChange={setCurrentPin}
            keyboardType="numeric"
            secure
          />
        )}
        <PinPad label={t('6-digit PIN')} value={pin} onChange={setPin} />
        <PinPad label={t('Confirm PIN')} value={confirm} onChange={setConfirm} />
        <Card>
          <View style={s.row}>
            <Text style={[s.text, { flex: 1 }]}>{t('Fingerprint unlock')}</Text>
            <Switch
              accessibilityLabel={t('Fingerprint unlock')}
              value={biometric}
              onValueChange={async (v) => {
                try {
                  if (v && !(await LocalAuthentication.hasHardwareAsync())) {
                    setPreferenceError(
                      'Biometric unlock requires a supported device with enrolled biometrics.',
                    );
                    return;
                  }
                  setBiometric(v);
                } catch {
                  setPreferenceError('Biometrics are unavailable on this device.');
                }
              }}
            />
          </View>
        </Card>
        {!!preferenceError && (
          <Text accessibilityRole="alert" style={s.error}>
            {preferenceError}
          </Text>
        )}
        <Button
          title={t('Confirm PIN \u276F')}
          onPress={async () => {
            if (!/^\d{6}$/.test(pin)) throw new Error('Enter all six PIN digits.');
            if (pin !== confirm) throw new Error('PINs do not match');
            await api('/me/security/pin', 'POST', { pin, ...(currentPin ? { currentPin } : {}) });
            await api('/me/preferences', 'PATCH', { biometricEnabled: biometric });
            session.setUser({ ...session.user!, hasPin: true, biometricEnabled: biometric });
            session.setLocked(false);
            n.navigate('M09');
          }}
        />
        <TrustBadges />
      </Page>
    );
  if (id === 'M09')
    return (
      <Page
        title={t('Choose your disguise')}
        tag="DISGUISE MODE"
        subtitle={t('CALCULATOR \u00B7 NOTES \u00B7 WEATHER')}
      >
        <Dots total={4} step={3} />
        {['calculator', 'notes', 'weather'].map((x) => (
          <Choice
            key={x}
            label={x[0]!.toUpperCase() + x.slice(1)}
            detail={
              x === 'calculator' ? 'Opens as a working calculator' : 'Internal utility disguise'
            }
            selected={disguise === x}
            onPress={() => setDisguise(x)}
          />
        ))}
        <Button
          title={t('Set disguise \u276F')}
          onPress={async () => {
            await disguiseProvider.set(disguise as 'calculator' | 'notes' | 'weather');
            const u = await api('/me/preferences', 'PATCH', { disguise });
            // The capability notice remains visible on this screen.
            session.setUser(u);
            n.navigate('M15');
          }}
        />
        <Text style={s.muted}>
          {t(
            'To open your private PIN entry, hold the calculator display or utility title for 1.5 seconds. Launcher icon changes require a supported native build.',
          )}
        </Text>
        <Trust />
      </Page>
    );
  if (id === 'M10')
    return (
      <Page title={t('Guardian mode')}>
        <PinPad label={t('6-digit PIN')} value={pin} onChange={setPin} />
        <Button
          title={t('Continue to Suraksha')}
          onPress={async () => {
            await api('/me/security/unlock', 'POST', { pin });
            session.setLocked(false);
            n.navigate('M12');
          }}
        />
        <Button
          title={t('Back to calculator')}
          tone="outline"
          onPress={() => {
            if (session.user?.hasPin) session.setLocked(true);
            else n.navigate('M08');
          }}
        />
      </Page>
    );
  return (
    <Page
      title={t('Your profile')}
      tag="SETTINGS"
      subtitle="Make this space work for you."
      nav
      navigation={n}
    >
      <Card style={{ backgroundColor: colors.navy, borderColor: colors.navy }}>
        <View style={s.row}>
          <View style={{ padding: 14, backgroundColor: '#ffffff18', borderRadius: 18 }}>
            <Icon name="shield" color="#5be0b0" size={30} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
              {session.user?.name}
            </Text>
            <Text style={{ color: '#cbdcf3', marginTop: 5, fontSize: 12 }}>
              Your account, your control
            </Text>
          </View>
        </View>
      </Card>
      {!!preferenceError && (
        <Text accessibilityRole="alert" style={s.error}>
          {preferenceError}
        </Text>
      )}
      <Card onPress={() => n.navigate('M03')}>
        <Text style={s.text}>{t('Language')}</Text>
        <Text style={s.muted}>{session.user?.locale}</Text>
      </Card>
      <Card onPress={() => n.navigate('M08')}>
        <Text style={s.text}>{t('App lock & disguise mode')}</Text>
        <Text style={s.muted}>{t('PIN + fingerprint')}</Text>
      </Card>
      <Card onPress={() => n.navigate('M09')}>
        <Text style={s.text}>{t('Choose your disguise')}</Text>
      </Card>
      <Card onPress={() => n.navigate('M16')}>
        <Text style={s.text}>{t('Location sharing defaults')}</Text>
        <Text style={s.muted}>{t('Trusted contacts only')}</Text>
      </Card>
      <Card>
        <View style={s.row}>
          <Text style={[s.text, { flex: 1 }]}>{t('Notifications')}</Text>
          <Switch
            accessibilityLabel={t('Notifications')}
            value={session.user?.notificationsEnabled}
            disabled={preferenceBusy}
            onValueChange={async (notificationsEnabled) => {
              setPreferenceBusy(true);
              setPreferenceError('');
              try {
                const granted = notificationsEnabled
                  ? await deviceNotifications.requestPermission()
                  : false;
                session.setUser(
                  await api('/me/preferences', 'PATCH', { notificationsEnabled: granted }),
                );
                if (notificationsEnabled && !granted)
                  setPreferenceError(
                    'Notifications are not enabled. You can allow them in your device or browser settings.',
                  );
              } catch (e) {
                setPreferenceError(
                  e instanceof Error ? e.message : 'Unable to save notification preference',
                );
              } finally {
                setPreferenceBusy(false);
              }
            }}
          />
        </View>
      </Card>
      <Card>
        <Text style={s.text}>{t('About Suraksha')}</Text>
        <Text style={s.muted}>{t('Version 0.1.0 \u00B7 Research prototype')}</Text>
      </Card>
      <Button
        title={t('Lock and disguise')}
        tone="outline"
        onPress={() => {
          if (session.user?.hasPin) session.setLocked(true);
          else n.navigate('M08');
        }}
      />
      <Button title={t('Delete my data')} tone="red" onPress={() => setDeleting(true)} />
      {deleting && (
        <Card>
          <Text style={s.text}>
            {t(
              'Permanently erase your account, vault and messages. This cannot be undone. Anonymous operational audit records remain.',
            )}
          </Text>
          <Input
            label={t('Type DELETE EVERYTHING')}
            value={confirmation}
            onChange={setConfirmation}
          />
          <Button
            title={t('Delete everything')}
            disabled={confirmation !== 'DELETE EVERYTHING'}
            tone="red"
            onPress={async () => {
              await api('/me', 'DELETE', { confirmation });
              await signOut();
              session.setUser(null);
            }}
          />
          <Button title={t('Cancel')} tone="outline" onPress={() => setDeleting(false)} />
        </Card>
      )}
      <Button
        title={t('Sign out')}
        tone="outline"
        onPress={async () => {
          await signOut();
          session.setUser(null);
        }}
      />
    </Page>
  );
}
