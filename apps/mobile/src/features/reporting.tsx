import { t } from '@suraksha/shared';
import React, { useState } from 'react';
import { Text, View, Switch, Pressable } from 'react-native';
import * as Crypto from 'expo-crypto';
import { api, useData } from '../lib/api';
import { ScreenProps } from '../lib/context';
import {
  Page,
  Icon,
  EmptyState,
  Card,
  Button,
  Choice,
  Input,
  State,
  Trust,
  TrustBadges,
  Stepper,
  colors,
  s,
} from '../components/ui';
import { readable } from '@suraksha/shared';
import { deviceLocation } from '../providers/location';
const categories = [
  ['CYBER_HARASSMENT', 'Cyber harassment', 'Threats, blackmail, stalking', '🖥'],
  ['DOMESTIC_VIOLENCE', 'Domestic violence', 'At home', '⌂'],
  ['WORKPLACE_HARASSMENT', 'Workplace harassment', 'At work', '💼'],
  ['PUBLIC_TRANSPORT_ABUSE', 'Public transport abuse', 'Bus, train, tuk', '🚌'],
];

function stageTimelineIndex(stage?: string) {
  if (stage === 'UNDER_INVESTIGATION') return 1;
  if (stage === 'SUSPECT_CONTACTED' || stage === 'RESOLVED') return 2;
  return 0;
}
export function ReportingScreen({ navigation: n, route }: ScreenProps) {
  const id = route.name;
  const [category, setCategory] = useState(route.params?.category || 'CYBER_HARASSMENT');
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [anonymous, setAnonymous] = useState(true);
  const [attachLocation, setAttachLocation] = useState(false);
  const [selected, setSelected] = useState<string[]>(route.params?.evidenceIds || []);
  const [queryId, setQueryId] = useState<string | undefined>(route.params?.queryId);
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState<any>(null);
  const [commentId, setCommentId] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [requestKey] = useState(() => Crypto.randomUUID());
  const evidence = useData<any[]>(id === 'M25' ? '/evidence' : null);
  const reports = useData<any[]>(id === 'M26' && !route.params?.reference ? '/cases' : null);
  const report = useData(
    id === 'M26' && route.params?.reference ? '/cases/' + route.params.reference : null,
  );
  const messages = useData<any[]>(
    id === 'M26' && route.params?.reference ? `/cases/${route.params.reference}/messages` : null,
  );
  const query = useData(id === 'M23' && queryId ? '/legal/queries/' + queryId : null);
  const queries = useData<any[]>(id === 'M23' ? '/legal/queries' : null);
  const posts = useData<any[]>(id === 'M27' ? '/community/posts' : null);
  const resources = useData<any[]>(
    id === 'M28' ? '/legal/resources?search=' + encodeURIComponent(search) : null,
  );
  if (id === 'M23')
    return (
      <Page
        title={t('Legal Aid Chat')}
        tag="CONFIDENTIAL"
        meta="INFORMATION & SUPPORT"
        subtitle={t('A private place to understand your options')}
      >
        <Card style={{ backgroundColor: '#eaf1fc', borderColor: '#d6e4f7' }}>
          <View style={s.row}>
            <Icon name="book" size={27} />
            <View style={{ flex: 1 }}>
              <Text style={[s.text, { fontWeight: '700' }]}>One question at a time.</Text>
              <Text style={s.muted}>
                Ask for information, or choose to connect with a human advisor.
              </Text>
            </View>
          </View>
        </Card>
        <State query={query} />
        {!queryId && <State query={queries} />}
        {queryId && (
          <Button
            title="Start a new conversation"
            tone="outline"
            onPress={() => {
              setQueryId(undefined);
              setText('');
            }}
          />
        )}
        {!queryId &&
          queries.data?.map((q) => (
            <Card key={q.id} onPress={() => setQueryId(q.id)}>
              <Text style={s.text}>{q.title}</Text>
              <Text style={s.badge}>{q.status}</Text>
            </Card>
          ))}
        {query.data?.messages.map((m: any) => (
          <Card
            key={m.id}
            style={
              m.role === 'USER'
                ? { marginLeft: 30 }
                : { marginRight: 30, backgroundColor: '#edf4fb' }
            }
          >
            <Text style={s.muted}>{readable(m.role)}</Text>
            <Text style={s.text}>{m.body}</Text>
          </Card>
        ))}
        <Input
          label={t('Message \u2014 ask about your rights\u2026')}
          value={text}
          onChange={setText}
          multiline
        />
        <Button
          title={t('Send message')}
          disabled={!text.trim()}
          onPress={async () => {
            if (queryId) {
              await api(`/legal/queries/${queryId}/messages`, 'POST', { body: text });
              await query.refetch();
            } else {
              const q = await api('/legal/queries', 'POST', { body: text });
              setQueryId(q.id);
            }
            setText('');
          }}
        />
        {queryId && (
          <Button
            title={query.data?.escalated ? 'Human advisor requested' : 'Connect to a human advisor'}
            tone="outline"
            disabled={query.data?.escalated}
            onPress={async () => {
              await api(`/legal/queries/${queryId}/escalate`, 'POST');
              await query.refetch();
            }}
          />
        )}
        <Button title={t('Help me file a report')} tone="blue" onPress={() => n.navigate('M24')} />
        <Text style={s.muted}>
          {t(
            'Legal information is not representation. Human responses depend on advisor availability. No unrestricted AI legal advice is generated.',
          )}
        </Text>
        <TrustBadges items={['PRIVATE CONVERSATION', 'HUMAN SUPPORT']} />
      </Page>
    );
  if (id === 'M24')
    return (
      <Page
        title={t('What happened?')}
        tag="START REPORT"
        meta="STEP 1 OF 3"
        subtitle={t('Choose the category that fits best')}
      >
        <Stepper step={1} total={3} label={t('Category')} />
        {categories.map(([value, label, detail]) => {
          const selected = category === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setCategory(value!)}
              style={[
                s.card,
                s.row,
                selected && { backgroundColor: '#e8faf2', borderColor: colors.green },
              ]}
            >
              <View style={{ padding: 12, backgroundColor: '#eaf1fc', borderRadius: 14 }}>
                <Icon
                  name={
                    value === 'CYBER_HARASSMENT'
                      ? 'scan'
                      : value === 'DOMESTIC_VIOLENCE'
                        ? 'home'
                        : value === 'WORKPLACE_HARASSMENT'
                          ? 'users'
                          : 'pin'
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>{label}</Text>
                <Text style={s.muted}>{detail}</Text>
              </View>
              <Text style={{ color: selected ? colors.green : colors.muted, fontSize: 20 }}>
                {selected ? '◉' : '○'}
              </Text>
            </Pressable>
          );
        })}
        <Button
          title={t('Continue \u276F')}
          tone="blue"
          onPress={() =>
            n.navigate('M25', { category, evidenceIds: route.params?.evidenceIds || [] })
          }
        />
        <Trust text="ANONYMOUS OPTION · ENCRYPTED AT REST" />
      </Page>
    );
  if (id === 'M25')
    return (
      <Page
        title={readable(category) + ' report'}
        tag="REPORT FORM"
        meta="STEP 2 OF 3"
        subtitle={t('Anonymous submission available')}
      >
        <Stepper step={2} total={3} label={t('Details & evidence')} />
        <Input label={t('When did this happen? (YYYY-MM-DD)')} value={date} onChange={setDate} />
        <Text style={s.section}>{t('Attach evidence')}</Text>
        <State query={evidence} />
        {evidence.data?.map((e) => (
          <Choice
            key={e.id}
            label={e.filename}
            selected={selected.includes(e.id)}
            onPress={() =>
              setSelected(
                selected.includes(e.id) ? selected.filter((x) => x !== e.id) : [...selected, e.id],
              )
            }
          />
        ))}
        {!evidence.data?.length && (
          <Button
            title={t('Add evidence to Vault')}
            tone="outline"
            onPress={() => n.navigate('M19')}
          />
        )}
        <Input label={t('Describe briefly (optional)')} value={text} onChange={setText} multiline />
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.text}>{t('Submit anonymously')}</Text>
            <Text style={s.muted}>{t('Hide identity except from your assigned handler')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('Submit anonymously')}
            value={anonymous}
            onValueChange={setAnonymous}
          />
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.text}>{t('Attach current location')}</Text>
            <Text style={s.muted}>
              {t('Only shared with your assigned police handler on this case')}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t('Attach current location')}
            value={attachLocation}
            onValueChange={setAttachLocation}
          />
        </View>
        <Button
          title={t('Submit report \u27A4')}
          tone="blue"
          onPress={async () => {
            const occurredAt = new Date(date);
            if (
              !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
              !Number.isFinite(occurredAt.getTime()) ||
              occurredAt.toISOString().slice(0, 10) !== date
            )
              throw new Error('Enter a valid date in YYYY-MM-DD format.');
            if (occurredAt.getTime() > Date.now())
              throw new Error('The incident date cannot be in the future.');
            let position:
              | { latitude: number; longitude: number; accuracy: number; capturedAt: string }
              | undefined;
            if (attachLocation) {
              const reading = await deviceLocation.current();
              if (reading.locationState !== 'AVAILABLE' || !reading.location)
                throw new Error(
                  'Location could not be captured. Turn off location attach or allow permission.',
                );
              position = reading.location;
            }
            const c = await api('/reports', 'POST', {
              category,
              occurredAt: occurredAt.toISOString(),
              description: text,
              anonymous,
              evidenceIds: selected,
              ...(position ? { position } : {}),
              idempotencyKey: requestKey,
            });
            n.replace('M26', { reference: c.reference });
          }}
        />
        <Trust />
      </Page>
    );
  if (id === 'M26') {
    if (!route.params?.reference)
      return (
        <Page title={t('My reports')} tag="CASE FOLLOW-UP" navigation={n}>
          <State query={reports} />
          {reports.data?.map((c) => (
            <Card key={c.reference} onPress={() => n.navigate('M26', { reference: c.reference })}>
              <Text style={s.text}>
                {t('Report #')}
                {c.reference}
              </Text>
              <Text style={s.badge}>{readable(c.stage)}</Text>
            </Card>
          ))}
          {!reports.data?.length && !reports.isLoading && !reports.error && (
            <EmptyState
              title="Your reports live here"
              detail="Track updates and stay in touch with your case officer after submitting a report."
            />
          )}
          <Button title="Start a report" onPress={() => n.navigate('M24')} />
        </Page>
      );
    const currentStep = stageTimelineIndex(report.data?.stage);
    const timeline = ['Received', 'Under review', 'Awaiting update'];
    return (
      <Page
        title={'Report #' + route.params.reference}
        tag="CASE FOLLOW-UP"
        meta="STEP 3 OF 3"
        subtitle={t('Track your case progress')}
      >
        <State query={report} />
        <Card>
          {report.data?.events?.length
            ? report.data.events.map((event: any, i: number) => (
                <View
                  key={event.id}
                  style={[s.row, { alignItems: 'flex-start', marginBottom: 12 }]}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.green,
                        marginTop: 4,
                      }}
                    />
                    {i < report.data.events.length - 1 && (
                      <View
                        style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: colors.line }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.text}>{event.publicText}</Text>
                    <Text style={s.muted}>{new Date(event.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            : timeline.map((label, i) => (
                <View key={label} style={[s.row, { marginBottom: 14 }]}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: i <= currentStep ? colors.green : colors.line,
                    }}
                  />
                  <Text style={[s.text, i === currentStep && { fontWeight: '700' }]}>
                    {label}
                    {i === currentStep ? t(' NOW') : ''}
                  </Text>
                </View>
              ))}
        </Card>
        <Text style={s.badge}>{readable(report.data?.stage || 'FILED')}</Text>
        <Button title={t('Refresh status')} tone="outline" onPress={() => report.refetch()} />
        {messages.data?.map((m) => (
          <Card key={m.id}>
            <Text style={s.text}>{m.body}</Text>
          </Card>
        ))}
        <Input label={t('Your message')} value={message} onChange={setMessage} multiline />
        <Button
          title={t('Message case officer')}
          disabled={!message.trim()}
          successMessage="Message sent to your case."
          onPress={async () => {
            await api(`/cases/${route.params.reference}/messages`, 'POST', { body: message });
            setMessage('');
            await messages.refetch();
          }}
        />
        <TrustBadges items={[`CASE #${route.params.reference}`, 'ENCRYPTED']} />
      </Page>
    );
  }
  if (id === 'M27')
    return (
      <Page
        title={t('Community')}
        tag="COMMUNITY"
        subtitle={t('Moderated peer support')}
        nav
        navigation={n}
      >
        <Input
          label={t('Share your story anonymously\u2026')}
          value={text}
          onChange={setText}
          multiline
        />
        <Button
          title={t('Submit for moderation')}
          disabled={!text.trim()}
          successMessage="Your post is saved for moderator review."
          onPress={async () => {
            await api('/community/posts', 'POST', { body: text });
            setText('');
            await posts.refetch();
          }}
        />
        <State query={posts} />
        {!posts.isLoading && !posts.error && !posts.data?.length && (
          <EmptyState
            title="A kinder space, together"
            detail="Share a thought or an experience. Posts are reviewed before they appear publicly."
            icon="message"
          />
        )}
        {posts.data?.map((p) => (
          <Card key={p.id}>
            <Text style={s.text}>{t('\u25CE Anonymous')}</Text>
            <Text style={s.text}>{p.body}</Text>
            <Text style={s.muted}>
              {new Date(p.createdAt).toLocaleDateString()}
              {t('\u00B7')}
              {p.status}
            </Text>
            <Text style={s.muted}>
              {t('\u2661')}
              {p._count.likes}
              {t('\u00B7 Comments')}
              {p.comments.length}
            </Text>
            {p.status === 'PUBLISHED' && (
              <>
                <View style={s.row}>
                  <Button
                    title={t('Like')}
                    tone="outline"
                    onPress={async () => {
                      await api('/community/posts/' + p.id + '/like', 'PUT');
                      await posts.refetch();
                    }}
                  />
                  <Button title={t('Comment')} tone="outline" onPress={() => setCommentId(p.id)} />
                </View>
                <Button
                  title={t('Report this post')}
                  successMessage="A moderator will review this post."
                  tone="outline"
                  onPress={() =>
                    api('/community/flags', 'POST', {
                      postId: p.id,
                      reason: 'User requests moderator review',
                    })
                  }
                />
                {p.comments.map((c: any) => (
                  <Card key={c.id}>
                    <Text style={s.text}>
                      {t('Anonymous:')}
                      {c.body}
                    </Text>
                  </Card>
                ))}
                {commentId === p.id && (
                  <>
                    <Input
                      label={t('Supportive comment')}
                      value={comment}
                      onChange={setComment}
                      multiline
                    />
                    <Button
                      title={t('Submit comment')}
                      disabled={!comment.trim()}
                      successMessage="Comment submitted for review."
                      onPress={async () => {
                        await api('/community/posts/' + p.id + '/comments', 'POST', {
                          body: comment,
                        });
                        setComment('');
                        setCommentId('');
                        await posts.refetch();
                      }}
                    />
                  </>
                )}
              </>
            )}
          </Card>
        ))}
        <Trust text="ANONYMOUS DISPLAY · REVIEW BEFORE PUBLICATION" />
      </Page>
    );
  return (
    <Page
      title={t('Know your rights')}
      tag="KNOWLEDGE HUB"
      subtitle={t('Plain-language legal guides')}
      nav
      navigation={n}
    >
      <Input label={t('Search guides\u2026')} value={search} onChange={setSearch} />
      <State query={resources} />
      {resources.data?.map((r) => (
        <Card key={r.id} onPress={async () => setResource(await api('/legal/resources/' + r.id))}>
          <Text style={s.text}>
            {t('\u25A2')}
            {r.title}
          </Text>
          <Text style={s.muted}>
            {r.readMinutes}
            {t('min read \u00B7')}
            {r.language}
          </Text>
        </Card>
      ))}
      {!resources.data?.length && !resources.isLoading && !resources.error && (
        <Card>
          <Text style={s.text}>
            {search.trim() ? 'No guides match your search.' : 'New guidance is on its way.'}
          </Text>
          <Text style={s.muted}>
            {t(
              'Only reviewed guidance appears here. You can ask Legal Aid for information and human support.',
            )}
          </Text>
        </Card>
      )}
      {resource && (
        <Card>
          <Button title="Close guide" tone="outline" onPress={() => setResource(null)} />
          <Text style={s.section}>{resource.title}</Text>
          <Text style={s.text}>{resource.body}</Text>
          <Text selectable style={s.muted}>
            {t('Source:')}
            {resource.sourceUrl}
          </Text>
        </Card>
      )}
      <Button title={t('Ask Legal Aid')} onPress={() => n.navigate('M23')} />
      <Trust text="REVIEWED CONTENT ONLY" />
    </Page>
  );
}
