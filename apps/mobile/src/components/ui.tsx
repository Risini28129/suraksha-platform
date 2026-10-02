import { t } from '@suraksha/shared';
import React, { useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContext } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Home,
  Image,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Plus,
  ScanText,
  Settings,
  ShieldCheck,
  Siren,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react-native';
export const colors = {
  ink: '#10213a',
  navy: '#153d7a',
  green: '#09a878',
  blue: '#175bcc',
  pale: '#f4f8fb',
  line: '#dce6ee',
  muted: '#6b8197',
  red: '#ef453d',
};
const icons = {
  arrow: ArrowRight,
  back: ArrowLeft,
  book: BookOpen,
  calendar: CalendarDays,
  camera: Camera,
  check: Check,
  chevron: ChevronRight,
  help: CircleHelp,
  eye: Eye,
  eyeOff: EyeOff,
  file: FileText,
  heart: Heart,
  home: Home,
  image: Image,
  lock: LockKeyhole,
  pin: MapPin,
  message: MessageCircle,
  mic: Mic,
  phone: Phone,
  plus: Plus,
  scan: ScanText,
  settings: Settings,
  shield: ShieldCheck,
  sos: Siren,
  trash: Trash2,
  users: Users,
  video: Video,
  close: X,
};
export type IconName = keyof typeof icons;
export function Icon({
  name = 'shield',
  size = 22,
  color = colors.navy,
}: {
  name?: IconName;
  size?: number;
  color?: string;
}) {
  const Glyph = icons[name];
  return <Glyph size={size} color={color} strokeWidth={1.8} />;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.pale },
  scroll: { padding: 22, paddingTop: 12, paddingBottom: 30, flexGrow: 1 },
  tag: {
    color: colors.green,
    backgroundColor: '#e5f8f0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: colors.ink,
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.navy,
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  muted: { fontSize: 12, color: colors.muted, lineHeight: 19 },
  button: {
    backgroundColor: colors.green,
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 7,
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    flexShrink: 1,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.ink, marginBottom: 9, marginTop: 14 },
  input: {
    backgroundColor: 'white',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 15,
    minHeight: 52,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 8,
  },
  error: {
    color: '#ab2924',
    backgroundColor: '#fff0ed',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    color: colors.blue,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    marginVertical: 12,
  },
  badge: {
    color: '#087954',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#e1f8ee',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    marginTop: 6,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 48, flex: 1 },
  navText: { fontSize: 10, fontWeight: '600', color: colors.muted },
  hero: { color: colors.green, fontSize: 60, textAlign: 'center', marginVertical: 30 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginVertical: 22 },
  dot: { height: 6, width: 6, borderRadius: 4, backgroundColor: colors.line },
  trust: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 16,
  },
  map: {
    minHeight: 200,
    backgroundColor: '#edf3ff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 8,
    padding: 20,
  },
  section: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.ink,
    marginTop: 22,
    marginBottom: 14,
  },
});
export function Page({
  title,
  tag,
  meta,
  subtitle,
  children,
  nav,
  navigation,
  discreet = false,
}: {
  title: string;
  tag?: string;
  meta?: string;
  subtitle?: string;
  children: React.ReactNode;
  nav?: boolean;
  navigation?: any;
  discreet?: boolean;
}) {
  const contextNavigation = useContext(NavigationContext);
  const n = navigation || contextNavigation;
  return (
    <SafeAreaView style={s.page}>
      {!discreet && (
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {n?.canGoBack() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Go back')}
              onPress={() => n.goBack()}
              style={({ pressed }) => ({
                padding: 10,
                backgroundColor: pressed ? colors.line : 'white',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <Icon name="back" size={20} />
            </Pressable>
          ) : (
            <View style={[s.row, { gap: 8 }]}>
              <Icon name="shield" color={colors.green} size={24} />
              <Text
                style={{ fontWeight: '800', letterSpacing: 1.8, fontSize: 13, color: colors.navy }}
              >
                SURAKSHA
              </Text>
            </View>
          )}
          <View style={[s.row, { gap: 6 }]}>
            <Icon name="lock" size={13} color={colors.muted} />
            <Text style={[s.muted, { fontSize: 10 }]}>Your private space</Text>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {(tag || meta) && (
            <View
              style={[
                s.row,
                { justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' },
              ]}
            >
              {tag && <Text style={s.tag}>{tag}</Text>}
              {meta && <Text style={[s.muted, { fontSize: 10, letterSpacing: 0.8 }]}>{meta}</Text>}
            </View>
          )}
          {!!title && (
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
          )}
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {nav && <BottomNav navigation={n} />}
    </SafeAreaView>
  );
}
export function BottomNav({ navigation }: { navigation: any }) {
  const state = navigation?.getState?.();
  const current = state?.routes?.[state.index]?.name;
  const items: [IconName, string, string][] = [
    ['home', 'Home', 'M12'],
    ['book', 'Knowledge', 'M28'],
    ['sos', 'SOS', 'M13'],
    ['lock', 'Vault', 'M18'],
    ['settings', 'Profile', 'M11'],
  ];
  return (
    <View style={s.nav}>
      {items.map(([icon, label, screen]) => {
        const selected = screen === current;
        return (
          <Pressable
            key={screen}
            accessibilityRole="button"
            accessibilityLabel={t(label)}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) navigation.navigate(screen);
            }}
            style={({ pressed }) => [s.navItem, { opacity: pressed ? 0.65 : 1 }]}
          >
            <View
              style={{
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor:
                  label === 'SOS' ? colors.red : selected ? '#e5f8f0' : 'transparent',
              }}
            >
              <Icon
                name={icon}
                size={22}
                color={label === 'SOS' ? 'white' : selected ? colors.green : colors.muted}
              />
            </View>
            <Text
              style={[
                s.navText,
                selected && { color: colors.green },
                label === 'SOS' && { color: colors.red },
              ]}
            >
              {t(label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
export function ShieldMark({ size = 72 }: { size?: number }) {
  return (
    <View
      accessibilityLabel={t('Suraksha shield')}
      style={{
        width: size * 1.35,
        height: size * 1.35,
        alignSelf: 'center',
        marginVertical: 22,
        borderRadius: size * 0.45,
        backgroundColor: '#e5f8f0',
        borderWidth: 1,
        borderColor: '#c8eddf',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-5deg' }],
      }}
    >
      <Icon name="shield" size={size * 0.7} color={colors.green} />
    </View>
  );
}
export function Stepper({
  step = 1,
  total = 5,
  label,
}: {
  step?: number;
  total?: number;
  label?: string;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      {label && (
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
          <Text style={s.muted}>{label}</Text>
          <Text style={[s.muted, { fontWeight: '700', color: colors.green }]}>
            {step} / {total}
          </Text>
        </View>
      )}
      <View style={[s.row, { gap: 5 }]}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              backgroundColor: i < step ? colors.green : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      style={[
        s.row,
        { backgroundColor: '#eaf0f5', borderRadius: 16, padding: 5, marginBottom: 12, gap: 4 },
      ]}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={{
            flex: 1,
            backgroundColor: option === value ? 'white' : 'transparent',
            borderRadius: 12,
            padding: 13,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: option === value ? colors.navy : colors.muted,
              fontWeight: '700',
              fontSize: 13,
            }}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function TrustBadges({
  items = ['PRIVATE', 'ENCRYPTED', 'YOUR CHOICE'],
}: {
  items?: string[];
}) {
  return (
    <View
      style={[s.row, { justifyContent: 'center', marginVertical: 20, flexWrap: 'wrap', gap: 12 }]}
    >
      {items.map((item) => (
        <View key={item} style={[s.row, { gap: 5 }]}>
          <Icon name="shield" size={12} color={colors.green} />
          <Text style={[s.muted, { fontSize: 9, fontWeight: '600' }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
export function IconCard({
  title,
  detail,
  icon,
  onPress,
  tone = 'default',
}: {
  title: string;
  detail: string;
  icon: string;
  onPress: () => void;
  tone?: 'default' | 'sos';
}) {
  const sos = tone === 'sos';
  const name = icon in icons ? (icon as IconName) : 'shield';
  return (
    <Card
      onPress={onPress}
      label={title}
      style={sos ? { backgroundColor: colors.red, borderColor: colors.red } : undefined}
    >
      <View style={s.row}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            backgroundColor: sos ? '#ffffff25' : '#eaf1fc',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={name} color={sos ? 'white' : colors.navy} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.text, { fontWeight: '700' }, sos && { color: 'white' }]}>{title}</Text>
          <Text style={[s.muted, sos && { color: '#fff0ee' }]}>{detail}</Text>
        </View>
        <Icon name="chevron" color={sos ? 'white' : colors.muted} size={18} />
      </View>
    </Card>
  );
}
export function Button({
  title,
  onPress,
  tone = 'green',
  disabled = false,
  successMessage,
}: {
  title: string;
  onPress: () => void | Promise<unknown>;
  tone?: 'green' | 'blue' | 'red' | 'outline';
  disabled?: boolean;
  successMessage?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const pending = useRef(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || busy, busy }}
        disabled={disabled || busy}
        style={({ pressed }) => [
          s.button,
          {
            backgroundColor: tone === 'outline' ? 'white' : colors[tone],
            borderWidth: tone === 'outline' ? 1 : 0,
            borderColor: colors.line,
            opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1,
          },
        ]}
        onPress={async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setError('');
          setSuccess(false);
          try {
            await onPress();
            setSuccess(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to complete action');
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
      >
        {busy && (
          <ActivityIndicator size="small" color={tone === 'outline' ? colors.navy : 'white'} />
        )}
        <Text style={[s.buttonText, tone === 'outline' && { color: colors.navy }]}>
          {busy ? t('Please wait...') : title}
        </Text>
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {success && successMessage && (
        <Text accessibilityLiveRegion="polite" style={s.badge}>
          {successMessage}
        </Text>
      )}
    </>
  );
}
export function Card({
  children,
  style,
  onPress,
  label,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  label?: string;
  onPress?: () => void | Promise<unknown>;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return onPress ? (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy }}
        disabled={busy}
        onPress={async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setError('');
          try {
            await onPress();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to open this item');
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
        style={({ pressed }) => [s.card, style, { opacity: pressed || busy ? 0.7 : 1 }]}
      >
        {children}
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </>
  ) : (
    <View style={[s.card, style]}>{children}</View>
  );
}
export function Input({
  label,
  value,
  onChange,
  secure = false,
  multiline = false,
  keyboardType = 'default',
  icon,
  revealable = false,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  icon?: string;
  revealable?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={{ position: 'relative' }}>
        {icon && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 14, top: 16, zIndex: 1 }}>
            <Icon
              name={secure ? 'lock' : keyboardType === 'phone-pad' ? 'phone' : 'file'}
              size={18}
              color={colors.muted}
            />
          </View>
        )}
        <TextInput
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure ? hidden : false}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={secure || keyboardType !== 'default' ? 'none' : 'sentences'}
          autoCorrect={!secure}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            s.input,
            focused && { borderColor: colors.green, backgroundColor: '#fcfffd' },
            icon ? { paddingLeft: 42 } : null,
            revealable ? { paddingRight: 50 } : null,
            multiline && { minHeight: 120, textAlignVertical: 'top' },
          ]}
        />
        {revealable && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('Show password') : t('Hide password')}
            onPress={() => setHidden((v) => !v)}
            style={{ position: 'absolute', right: 2, top: 3, padding: 12 }}
          >
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function PasswordStrength({ value }: { value: string }) {
  const score =
    (value.length >= 8 ? 1 : 0) +
    (/[0-9]/.test(value) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(value) ? 1 : 0) +
    (/[A-Z]/.test(value) && /[a-z]/.test(value) ? 1 : 0);
  return (
    <View style={[s.row, { gap: 5, marginBottom: 10 }]}>
      {Array.from({ length: 4 }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 3,
            backgroundColor: i < score ? colors.green : colors.line,
          }}
        />
      ))}
    </View>
  );
}
export function relativeTime(iso: string) {
  const date = new Date(iso);
  const delta = Date.now() - date.getTime();
  if (!Number.isFinite(delta)) return 'Date unavailable';
  if (delta < 0) return date.toLocaleDateString();
  if (delta < 60000) return 'Just now';
  if (delta < 3600000) return `${Math.floor(delta / 60000)} min ago`;
  if (delta < 86400000) return `${Math.floor(delta / 3600000)} hr ago`;
  const days = Math.floor(delta / 86400000);
  return days === 1 ? 'Yesterday' : days < 14 ? `${days} days ago` : date.toLocaleDateString();
}
export function Choice({
  label,
  selected,
  onPress,
  detail,
}: {
  label: string;
  selected: boolean;
  onPress: () => void | Promise<unknown>;
  detail?: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return (
    <>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected, disabled: busy }}
        aria-checked={selected}
        disabled={busy}
        onPress={async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setError('');
          try {
            await onPress();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to save choice');
          } finally {
            pending.current = false;
            setBusy(false);
          }
        }}
        style={[
          s.card,
          s.row,
          selected && { backgroundColor: '#effbf5', borderColor: colors.green },
        ]}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: selected ? 0 : 1.5,
            borderColor: colors.line,
            backgroundColor: selected ? colors.green : 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <Icon name="check" size={14} color="white" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.text, { fontWeight: selected ? '600' : '400' }]}>{label}</Text>
          {detail && <Text style={[s.muted, { marginTop: 4 }]}>{detail}</Text>}
        </View>
        {busy && <ActivityIndicator color={colors.green} />}
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </>
  );
}
export function State({
  query,
}: {
  query: { isLoading: boolean; error: Error | null; refetch?: () => Promise<unknown> };
}) {
  if (query.isLoading)
    return (
      <View style={[s.row, { justifyContent: 'center', padding: 24 }]}>
        <ActivityIndicator accessibilityLabel={t('Loading')} color={colors.green} />
        <Text style={s.muted}>Loading your space...</Text>
      </View>
    );
  if (query.error)
    return (
      <View>
        <Text accessibilityRole="alert" style={s.error}>
          {query.error.message}
        </Text>
        {query.refetch && <Button title="Try again" tone="outline" onPress={query.refetch} />}
      </View>
    );
  return null;
}
export function EmptyState({
  title,
  detail,
  icon = 'file',
}: {
  title: string;
  detail: string;
  icon?: IconName;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 16, gap: 10 }}>
      <View style={{ backgroundColor: '#eaf1fc', padding: 18, borderRadius: 22 }}>
        <Icon name={icon} size={30} />
      </View>
      <Text style={[s.text, { fontWeight: '700', textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{detail}</Text>
    </View>
  );
}
export function Trust({ text = 'PRIVATE ACCESS | SURAKSHA PROTOTYPE' }: { text?: string }) {
  return <Text style={s.trust}>{text}</Text>;
}
export function Dots({ step = 1, total = 3 }: { step?: number; total?: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[s.dot, i === step - 1 && { width: 24, backgroundColor: colors.green }]}
        />
      ))}
    </View>
  );
}
export function MapCard({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const located = latitude !== undefined && longitude !== undefined;
  return (
    <View style={s.map}>
      <View
        style={{
          backgroundColor: 'white',
          padding: 14,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <Icon name="pin" color={colors.blue} size={30} />
      </View>
      <Text style={[s.text, { fontWeight: '600' }]}>
        {located ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Location not shared'}
      </Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>
        {located ? 'Recorded coordinates | preview' : 'You choose when to share your location.'}
      </Text>
    </View>
  );
}
export function PinPad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View accessibilityLabel={label}>
      <Text style={s.label}>{t(label)}</Text>
      <View style={[s.row, { justifyContent: 'center', marginVertical: 18 }]}>
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={i}
            style={{
              height: 13,
              width: 13,
              borderRadius: 7,
              borderWidth: 1,
              borderColor: i < value.length ? colors.green : colors.line,
              backgroundColor: i < value.length ? colors.green : 'white',
            }}
          />
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '\u232b'].map((digit, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={
              digit === '\u232b' ? 'Delete PIN digit' : digit || 'Empty keypad cell'
            }
            disabled={!digit}
            onPress={() =>
              onChange(digit === '\u232b' ? value.slice(0, -1) : (value + digit).slice(0, 6))
            }
            style={({ pressed }) => ({
              width: '30%',
              minHeight: 52,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: pressed ? '#e5f8f0' : 'white',
              borderWidth: 1,
              borderColor: colors.line,
              opacity: digit ? 1 : 0,
            })}
          >
            <Text style={[s.text, { fontSize: 22, fontWeight: '600' }]}>{digit}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
