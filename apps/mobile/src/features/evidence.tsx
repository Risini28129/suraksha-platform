import { t } from '@suraksha/shared';
import React, { useState, useEffect } from 'react';
import { Text, View, Image, Pressable, Platform } from 'react-native';
import { deviceMedia, type EvidenceFile } from '../providers/media';
import { AudioCapture, EvidenceMediaPreview } from '../components/evidence-media';
import { File, Paths } from 'expo-file-system';
import { prepareEvidence } from '../lib/evidence-upload';
import { api, useData, evidenceBytes } from '../lib/api';
import { ScreenProps } from '../lib/context';
import {
  Page,
  Icon,
  EmptyState,
  Card,
  Button,
  Input,
  State,
  Trust,
  TrustBadges,
  PinPad,
  relativeTime,
  colors,
  s,
} from '../components/ui';

function evidenceTag(kind: string) {
  if (kind === 'Photo') return 'Threat';
  if (kind === 'Chat log') return 'Chat';
  return kind;
}

const captureTypes: [string, string][] = [
  ['Photo', '▣'],
  ['Audio', '◎'],
  ['Video', '▶'],
  ['Chat log', '▤'],
];

export function EvidenceScreen({ navigation: n, route }: ScreenProps) {
  const id = route.name;
  const vault = useData<any[]>(id === 'M18' ? '/evidence' : null);
  const detail = useData(id === 'M20' && route.params?.id ? '/evidence/' + route.params.id : null);
  const analysis = useData(
    id === 'M22' && route.params?.id ? '/analysis/' + route.params.id : null,
  );
  const [kind, setKind] = useState('Photo');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [text, setText] = useState('');
  const [pin, setPin] = useState('');
  const [preview, setPreview] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [mediaPreview, setMediaPreview] = useState<Uint8Array | null>(null);
  const [chatText, setChatText] = useState('');
  const [scan, setScan] = useState<any>(null);
  useEffect(
    () => () => {
      if (Platform.OS !== 'web' && file?.uri.startsWith(Paths.cache.uri)) {
        try {
          const cached = new File(file.uri);
          if (cached.exists) cached.delete();
        } catch {
          /* The OS may already have evicted its cache copy. */
        }
      }
    },
    [file],
  );

  if (id === 'M18')
    return (
      <Page
        title={t('Evidence Vault')}
        tag="EVIDENCE VAULT"
        subtitle={`${vault.data?.length || 0} items · Tamper-evident copies`}
        nav
        navigation={n}
      >
        <State query={vault} />
        {!vault.data?.length && !vault.isLoading && !vault.error && (
          <EmptyState
            title="Your story, protected"
            detail="Add a photo, recording or message. Your evidence stays in your private vault."
            icon="lock"
          />
        )}
        {vault.data?.map((e) => (
          <Card key={e.id} onPress={() => n.navigate('M20', { id: e.id })}>
            <View style={s.row}>
              <Text style={{ fontSize: 24 }}>{t('\u25A2')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>{e.filename}</Text>
                <Text style={s.muted}>{relativeTime(e.createdAt)}</Text>
              </View>
              <Text style={s.badge}>{evidenceTag(e.kind)}</Text>
            </View>
          </Card>
        ))}
        <Button title={t('\uFF0B Add evidence')} tone="blue" onPress={() => n.navigate('M19')} />
        <Trust text="ENCRYPTED AT REST · TAMPER-EVIDENT" />
      </Page>
    );
  if (id === 'M19')
    return (
      <Page
        title={t('Add evidence')}
        tag="ADD EVIDENCE"
        subtitle={t('Choose a type to capture or import')}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          {captureTypes.map(([label]) => {
            const selected = kind === label;
            return (
              <Pressable
                key={label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setFile(null);
                  setKind(label);
                }}
                style={[
                  s.card,
                  {
                    width: '47%',
                    alignItems: 'center',
                    paddingVertical: 22,
                    marginBottom: 0,
                  },
                  selected && { backgroundColor: '#e8faf2', borderColor: colors.green },
                ]}
              >
                <View style={{ marginBottom: 10 }}>
                  <Icon
                    name={
                      label === 'Photo'
                        ? 'image'
                        : label === 'Audio'
                          ? 'mic'
                          : label === 'Video'
                            ? 'video'
                            : 'message'
                    }
                    size={28}
                  />
                </View>
                <Text style={s.text}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          title={file ? file.name : 'Choose file to import'}
          tone="outline"
          onPress={async () => {
            const result = await deviceMedia.import(kind);
            if (result) setFile(result);
          }}
        />
        {(kind === 'Photo' || kind === 'Video') && (
          <Button
            title={kind === 'Photo' ? t('Take photo') : t('Record video')}
            tone="outline"
            onPress={async () => {
              const result = await deviceMedia.capture(kind);
              if (result) setFile(result);
            }}
          />
        )}
        {kind === 'Audio' && <AudioCapture onCaptured={setFile} />}
        {kind === 'Chat log' && (
          <Input
            label={t('Paste chat text (or import a file)')}
            value={chatText}
            onChange={setChatText}
            multiline
          />
        )}
        <Input
          label={t('Note (optional) \u2014 what happened, when, where\u2026')}
          value={note}
          onChange={setNote}
          multiline
        />
        <Button
          title={t('Encrypt & save')}
          onPress={async () => {
            const upload = await prepareEvidence(file, kind, chatText, note);
            try {
              const item = await api('/evidence', 'POST', upload.data);
              setChatText('');
              setFile(null);
              n.replace('M20', { id: item.id });
            } finally {
              upload.cleanup();
            }
          }}
        />
        <Trust text="AES-256-GCM ENCRYPTION AT REST" />
      </Page>
    );
  if (id === 'M20')
    return (
      <Page
        title={detail.data?.filename || 'Sealed record'}
        tag="LOCKED RECORD"
        subtitle={t('Evidence detail')}
      >
        <State query={detail} />
        <Card>
          <Text style={[s.text, { textAlign: 'center' }]}>{t('\u2659 Encrypted preview')}</Text>
          <PinPad label={t('Unlock with 6-digit PIN')} value={pin} onChange={setPin} />
          <Button
            title={t('Verify & unlock preview')}
            disabled={pin.length !== 6 || !detail.data}
            tone="outline"
            onPress={async () => {
              if (!detail.data?.mediaType) throw new Error('Evidence details are still loading');
              const result = await api(`/evidence/${route.params.id}/unlock`, 'POST', { pin });
              const bytes = await evidenceBytes(route.params.id, result.proof);
              const mediaType = detail.data.mediaType;
              if (mediaType.startsWith('image/') && bytes.length <= 5 * 1024 * 1024) {
                const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
                setImagePreview('data:' + mediaType + ';base64,' + base64);
              }
              setMediaPreview(/^(audio|video)\//.test(mediaType) ? bytes : null);
              setPreview(
                mediaType.startsWith('text/')
                  ? new TextDecoder().decode(bytes)
                  : `Integrity verified. ${bytes.length} decrypted bytes. Use the media preview when this file format is supported by your device.`,
              );
              setPin('');
            }}
          />
          {imagePreview && (
            <Image
              accessibilityLabel="Unlocked evidence preview"
              source={{ uri: imagePreview }}
              style={{ height: 300, width: '100%' }}
              resizeMode="contain"
            />
          )}
          {mediaPreview && detail.data?.mediaType && (
            <EvidenceMediaPreview bytes={mediaPreview} mediaType={detail.data.mediaType} />
          )}
          {preview && <Text style={s.text}>{preview}</Text>}
        </Card>
        <Card>
          <Text style={s.text}>{t('Captured')}</Text>
          <Text style={s.muted}>
            {detail.data?.capturedAt && new Date(detail.data.capturedAt).toLocaleString()}
          </Text>
        </Card>
        <Card>
          <Text style={s.text}>{t('Location tag')}</Text>
          <Text style={s.muted}>{detail.data?.locationTag || 'Not supplied'}</Text>
        </Card>
        <Card>
          <Text style={s.text}>{t('Hash sealed')}</Text>
          <Text selectable style={s.muted}>
            {detail.data?.sha256}
          </Text>
          <Text style={s.badge}>{t('SHA-256 recorded \u00B7 verified on download')}</Text>
        </Card>
        <Button
          title={t('Attach to report')}
          tone="outline"
          onPress={() => n.navigate('M24', { evidenceIds: [route.params.id] })}
        />
        <TrustBadges items={['ENCRYPTED', 'TAMPER-EVIDENT']} />
      </Page>
    );
  if (id === 'M21')
    return (
      <Page
        title={t('Scan a message')}
        tag="AI DETECTION"
        subtitle={t('We\u2019ll check text for harassment patterns')}
      >
        <Card>
          <Text style={s.text}>{t('Upload screenshot or paste text')}</Text>
          <Text style={s.muted}>
            {
              'Import a clear English screenshot, review the extracted text, then check the message.'
            }
          </Text>
        </Card>
        <Button
          title="Import screenshot"
          tone="outline"
          onPress={async () => {
            const image = await deviceMedia.import('Photo');
            if (!image) return;
            try {
              const upload = await prepareEvidence(image, 'Photo', '', '');
              try {
                const result = await api('/analysis/ocr', 'POST', upload.data);
                setText(result.text);
                setScan(null);
              } finally {
                upload.cleanup();
              }
            } finally {
              if (Platform.OS !== 'web' && image.uri.startsWith(Paths.cache.uri)) {
                const cached = new File(image.uri);
                if (cached.exists) cached.delete();
              }
            }
          }}
        />
        <Input label={t('Message text')} value={text} onChange={setText} multiline />
        <Button
          title={t('Analyse with AI')}
          disabled={!text.trim()}
          tone="blue"
          onPress={async () => {
            const result = await api('/analysis', 'POST', { text, language: 'auto' });
            setScan(result);
          }}
        />
        {scan && (
          <Card>
            <Text style={s.text}>{scan.classification}</Text>
            <Text style={s.muted}>{scan.explanation}</Text>
            <Text style={s.badge}>{'Basic phrase check - review the context'}</Text>
            <Button
              title={t('View full analysis')}
              onPress={() => n.navigate('M22', { id: scan.id })}
            />
            <Button title={t('Dismiss')} tone="outline" onPress={() => setScan(null)} />
            <Button
              title={t('Escalate to Legal Aid')}
              tone="red"
              onPress={() => n.navigate('M23')}
            />
          </Card>
        )}
        <Trust text="DEVELOPMENT ANALYSIS · NON-VALIDATED" />
      </Page>
    );
  const result = analysis.data;
  const saved = !!result?.evidenceId;
  const flagged = result?.classification === 'DEVELOPMENT_FLAG';
  const report = () => n.navigate('M24', { evidenceIds: saved ? [result.evidenceId] : [] });
  return (
    <Page
      title={t('Analysis result')}
      tag="AI RESULT"
      subtitle={t('Based on your submitted message')}
    >
      <State query={analysis} />
      {result && (
        <>
          <Card
            style={{
              backgroundColor: flagged ? '#fff0ef' : '#eef4fc',
              borderColor: flagged ? '#ffdbd7' : '#dce6ee',
              padding: 20,
            }}
          >
            <View style={[s.row, { alignItems: 'center', gap: 16 }]}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 4,
                  borderColor: flagged ? colors.red : colors.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={flagged ? 'sos' : 'scan'}
                  color={flagged ? colors.red : colors.blue}
                  size={28}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[s.text, { fontWeight: '700', color: flagged ? colors.red : colors.navy }]}
                >
                  {flagged ? 'Concerning wording found' : 'No matching phrase found'}
                </Text>
                <Text style={[s.muted, { marginTop: 5 }]}>
                  {flagged
                    ? 'Review this message and choose your next step.'
                    : 'This does not confirm the message is safe.'}
                </Text>
              </View>
            </View>
            <Text style={[s.muted, { marginTop: 12, fontSize: 11 }]}>
              Basic phrase check. No risk percentage is available.
            </Text>
          </Card>
          <View style={[s.row, { gap: 12 }]}>
            <Card
              label="Open saved evidence"
              onPress={saved ? () => n.navigate('M20', { id: result.evidenceId }) : undefined}
              style={{ flex: 1 }}
            >
              <Text style={s.muted}>Save to vault</Text>
              <View style={[s.row, { marginTop: 8, justifyContent: 'space-between' }]}>
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: '700',
                    color: saved ? colors.green : colors.muted,
                  }}
                >
                  {saved ? 'Saved' : 'Not saved'}
                </Text>
                {saved && <Icon name="check" color={colors.green} size={21} />}
              </View>
            </Card>
            <Card label="File a report" onPress={report} style={{ flex: 1 }}>
              <Text style={s.muted}>File a report</Text>
              <View style={[s.row, { marginTop: 8, justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 21, fontWeight: '700', color: colors.blue }}>
                  Continue
                </Text>
                <Icon name="arrow" size={20} color={colors.blue} />
              </View>
            </Card>
          </View>
          <Button title={t('Talk to Legal Chatbot')} onPress={() => n.navigate('M23')} />
          <Text
            style={[
              s.muted,
              {
                marginTop: 20,
                marginBottom: 16,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
              },
            ]}
          >
            WHAT HAPPENS NEXT
          </Text>
          {[
            {
              title: saved ? 'Evidence encrypted' : 'Analysis recorded',
              detail: saved
                ? 'Stored securely when analysis completed'
                : 'Your message check is complete',
              complete: true,
            },
            {
              title: saved ? 'Available in your Vault' : 'Add evidence when ready',
              detail: saved
                ? 'Open the Saved card to view it with your PIN'
                : 'Keep a copy before making a report',
              complete: saved,
            },
            {
              title: 'Legal Aid support',
              detail: 'Request a human advisor in Legal Chat when you choose',
              complete: false,
            },
          ].map((step, index) => (
            <View key={step.title} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 14, alignItems: 'center' }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginTop: 5,
                    backgroundColor: step.complete ? colors.green : colors.line,
                  }}
                />
                {index < 2 && (
                  <View
                    style={{ width: 2, flex: 1, minHeight: 34, backgroundColor: colors.line }}
                  />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: 18 }}>
                <Text style={[s.text, { fontWeight: '600', fontSize: 14 }]}>{step.title}</Text>
                <Text style={[s.muted, { fontSize: 12, marginTop: 3 }]}>{step.detail}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
