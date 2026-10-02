'use client';
import { t } from '@suraksha/shared';

import { useState } from 'react';
import { ArrowUpRight, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { api, useData } from '../lib/api';
import {
  Title,
  Card,
  Metrics,
  State,
  CaseTable,
  Field,
  Tabs,
  Badge,
  Action,
} from '../components/ui';
import { readable, percent } from '@suraksha/shared';
export function AdminOverview({ name = 'Admin' }: { name?: string }) {
  const q = useData('/admin/overview');
  const [search, setSearch] = useState('');
  if (!q.data) return <State {...q} retry={q.reload} />;
  const d = q.data;
  const needle = search.trim().toLowerCase();
  const events = d.events.filter(
    (x: any) =>
      !needle ||
      readable(x.action).toLowerCase().includes(needle) ||
      String(x.id).toLowerCase().includes(needle),
  );
  const incidents = d.incidents.filter(
    (r: any) =>
      !needle ||
      r.reference.toLowerCase().includes(needle) ||
      readable(r.category).toLowerCase().includes(needle) ||
      (r.officer?.name || '').toLowerCase().includes(needle),
  );
  const maxActivity = Math.max(1, ...d.days.flatMap((x: any) => [x.reports, x.sos]));
  return (
    <>
      <Title
        title={t('Overview')}
        subtitle={t('A clear view of the people and reports that need you.')}
      >
        <input
          className="search"
          placeholder={t('Search recent reports or activity…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('Search overview')}
        />
      </Title>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">EVERY ACTION MAKES A DIFFERENCE</span>
          <h2>
            Welcome back, {name.split(' ')[0]}{' '}
            <span className="welcome-spark" aria-hidden="true">
              ✦
            </span>
          </h2>
          <p>
            Your community's safety starts with thoughtful care.
            <br />
            Let's make today a little safer, together.
          </p>
          <a className="button" href="/admin/reports">
            Review reports <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <ShieldCheck size={90} strokeWidth={1.2} />
          <span className="art-pill">
            <Users size={18} /> People first
          </span>
        </div>
      </section>
      <Metrics
        items={[
          ['Total active users', d.users],
          ['Open reports', d.openReports],
          ['SOS today', d.sosToday],
          ['Accounts verified', percent(d.verified, d.users) + '%'],
        ]}
      />
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR PLATFORM AT A GLANCE</span>
          <h2>Activity & updates</h2>
        </div>
        <span className="muted">Last 7 days · database records</span>
      </div>
      <div className="two-col">
        <Card title={t('Weekly Activity')}>
          <div className="chart dual">
            {d.days.map((x: any) => (
              <div key={x.date} className="chart-day">
                <div className="bars">
                  <div
                    className="bar reports"
                    style={{ height: Math.max(2, (x.reports / maxActivity) * 150) }}
                    title={`${x.reports} reports`}
                  />
                  <div
                    className="bar sos"
                    style={{ height: Math.max(2, (x.sos / maxActivity) * 150) }}
                    title={`${x.sos} SOS`}
                  />
                </div>
                <small>{new Date(x.date).toLocaleDateString('en', { weekday: 'short' })}</small>
              </div>
            ))}
          </div>
          <p className="legend">
            <span className="dot green" /> {t('Reports')}
            <span className="dot blue" /> {t('SOS')}
          </p>
        </Card>
        <Card title={t('Recent activity')}>
          <Badge>Latest recorded events</Badge>
          <div className="feed-list">
            {events.map((x: any) => (
              <div className="feed-item" key={x.id}>
                <i />
                {readable(x.action)}
                <small>{new Date(x.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
          <State empty={!events.length} />
        </Card>
      </div>
      <div className="quick-links">
        <a href="/admin/users">
          <Users />
          <div>
            <strong>People & access</strong>
            <small>Manage your support network</small>
          </div>
          <ArrowUpRight />
        </a>
        <a href="/admin/moderation">
          <ShieldCheck />
          <div>
            <strong>A kinder community</strong>
            <small>Review flagged content</small>
          </div>
          <ArrowUpRight />
        </a>
        <a href="/admin/settings/models">
          <Sparkles />
          <div>
            <strong>Responsible AI</strong>
            <small>Review models and audit activity</small>
          </div>
          <ArrowUpRight />
        </a>
      </div>
      <Card title={t('Recent Incidents')}>
        <a className="section-link" href="/admin/reports">
          View all reports →
        </a>
        <CaseTable rows={incidents} prefix="/admin" />
      </Card>
    </>
  );
}
function matchesUserTab(u: any, tab: string) {
  if (tab === 'All users') return true;
  if (tab === 'Women (Verified)') return u.role === 'USER' && u.verified;
  if (tab === 'Police') return u.role === 'POLICE';
  if (tab === 'Counselors') return u.role === 'COUNSELOR';
  if (tab === 'Pending') return !u.verified;
  if (tab === 'Legal advisors') return u.role === 'LEGAL_ADVISOR';
  return true;
}

export function UserManagement() {
  const q = useData<any[]>('/admin/users');
  const [tab, setTab] = useState('All users');
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    login: '',
    password: '',
    role: 'POLICE',
    jurisdiction: 'Colombo',
  });
  const rows = (q.data || []).filter(
    (u) =>
      matchesUserTab(u, tab) &&
      `$<strong>{u.name}</strong> ${u.credentialId || ''} ${readable(u.role)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Title title={t('User Management')} subtitle={t('Accounts and professional verification')}>
        <button onClick={() => setShow(!show)}>{show ? 'Close form' : '+ Add staff member'}</button>
      </Title>
      <Metrics
        items={[
          ['Total users', q.data?.length || 0],
          ['Verified', q.data?.filter((u) => u.verified).length || 0],
          ['Pending review', q.data?.filter((u) => !u.verified).length || 0],
          ['Suspended', q.data?.filter((u) => u.status === 'SUSPENDED').length || 0],
        ]}
      />
      {show && (
        <Card title={t('Provision staff account')}>
          <div className="form-grid">
            {(['name', 'login', 'password', 'jurisdiction'] as const).map((key) => (
              <Field key={key} label={readable(key)}>
                <input
                  type={key === 'password' ? 'password' : 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label={t('Role')}>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {['POLICE', 'COUNSELOR', 'LEGAL_ADVISOR', 'ADMIN'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <p>{t('New staff accounts require verification before sign-in.')}</p>
          <Action
            label={t('Create pending account')}
            onClick={async () => {
              await api('/admin/users', 'POST', form);
              setShow(false);
              await q.reload();
            }}
          />
        </Card>
      )}
      <Card>
        <div className="table-toolbar">
          <div>
            <h2>Your people</h2>
            <p className="muted">{rows.length} accounts matching your view</p>
          </div>
          <input
            aria-label="Search users"
            placeholder="Search name, staff ID or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs
          options={[
            'All users',
            'Women (Verified)',
            'Police',
            'Counselors',
            'Pending',
            'Legal advisors',
          ]}
          value={tab}
          onChange={setTab}
        />
        <State {...q} retry={q.reload} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('User')}</th>
                <th>{t('Role')}</th>
                <th>{t('Verification')}</th>
                <th>{t('Status')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <small>{u.credentialId || 'Community account'}</small>
                  </td>
                  <td>{readable(u.role)}</td>
                  <td>
                    <Badge tone={u.verified ? '' : 'amber'}>
                      {u.verified ? 'Verified' : 'Pending review'}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={u.status === 'ACTIVE' ? '' : 'red'}>{readable(u.status)}</Badge>
                  </td>
                  <td className="actions">
                    <Action
                      secondary
                      label={u.verified ? 'Revoke verification' : 'Verify'}
                      onClick={async () => {
                        await api('/admin/users/' + u.id, 'PATCH', { verified: !u.verified });
                        await q.reload();
                      }}
                    />
                    <Action
                      secondary
                      label={u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      onClick={async () => {
                        await api('/admin/users/' + u.id, 'PATCH', {
                          status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        });
                        await q.reload();
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <State empty={!q.loading && !q.error && !rows.length} />
      </Card>
    </>
  );
}
export function Moderation() {
  const q = useData<any[]>('/admin/moderation');
  const [tab, setTab] = useState('All flagged');
  const rows = (q.data || []).filter(
    (x) =>
      tab === 'All flagged' ||
      (tab === 'Posts' && x.post) ||
      (tab === 'Comments' && x.comment) ||
      (tab === 'User-reported' && x.source === 'USER_REPORTED'),
  );
  return (
    <>
      <Title
        title={t('Content Moderation')}
        subtitle={t('Community safety \u00B7 Suraksha Admin')}
      />
      <Metrics
        items={[
          ['Pending review', q.data?.length || 0],
          ['Posts', q.data?.filter((x) => x.post).length || 0],
          ['User-reported', q.data?.filter((x) => x.source === 'USER_REPORTED').length || 0],
          ['Automatic publication', 'Off'],
        ]}
      />
      <Card>
        <Tabs
          options={['All flagged', 'Posts', 'Comments', 'User-reported']}
          value={tab}
          onChange={setTab}
        />
        <State {...q} empty={!rows.length} retry={q.reload} />
        {rows.map((x) => (
          <article className="queue-row" key={x.id}>
            <div>
              <Badge tone="amber">{readable(x.source)}</Badge>
              <h3>{x.post ? 'Flagged post' : 'Flagged comment'}</h3>
              <p>{x.post?.body || x.comment?.body}</p>
              <small>Submitted {new Date(x.createdAt).toLocaleDateString()}</small>
              <small>{x.reason}</small>
            </div>
            <div className="stack">
              <Action
                label={t('Approve')}
                onClick={async () => {
                  await api('/admin/moderation/' + x.id, 'PATCH', { action: 'APPROVE' });
                  await q.reload();
                }}
              />
              <Action
                danger
                secondary
                label={t('Remove')}
                onClick={async () => {
                  await api('/admin/moderation/' + x.id, 'PATCH', { action: 'REMOVE' });
                  await q.reload();
                }}
              />
            </div>
          </article>
        ))}
      </Card>
    </>
  );
}
export function ModelMonitoring() {
  const q = useData<any[]>('/admin/models');
  const [detail, setDetail] = useState('');
  const [modelId, setModelId] = useState('');
  return (
    <>
      <Title
        title={t('AI Model Monitoring')}
        subtitle={t('Settings \u00B7 model provenance and audit')}
      />
      <Metrics
        items={[
          ['Validated accuracy', 'Unavailable'],
          ['False-positive rate', 'Unevaluated'],
          ['Registered models', q.data?.length || 0],
          ['Regional coverage', 'Unevaluated'],
        ]}
      />
      <div className="two-col">
        <Card title={t('Model Performance')}>
          <State {...q} retry={q.reload} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('Model')}</th>
                  <th>{t('Accuracy')}</th>
                  <th>{t('Drift')}</th>
                  <th>{t('Provider')}</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.name}
                      <small>{m.id}</small>
                    </td>
                    <td>{m.metrics.length ? 'See evaluation records' : 'No evaluation'}</td>
                    <td>
                      <Badge tone="amber">{readable(m.driftStatus)}</Badge>
                    </td>
                    <td>{m.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={t('Sinhala / Tamil Coverage')}>
          {['English', 'Sinhala', 'Tamil'].map((x) => (
            <p key={x}>
              {x}
              <progress value={0} max={100} />
              <small>{t('No validated evaluation supplied')}</small>
            </p>
          ))}
        </Card>
      </div>
      <Card title={t('Recent Audit Activity')}>
        <Field label="Model to review">
          <select
            value={modelId || q.data?.[0]?.id || ''}
            onChange={(e) => setModelId(e.target.value)}
          >
            {q.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        {q.data
          ?.flatMap((m) => m.events)
          .map((e: any) => (
            <p key={e.id}>
              <Badge>{e.type}</Badge> {e.detail}
            </p>
          ))}
        <Field label={t('Retraining or override review note')}>
          <textarea value={detail} onChange={(e) => setDetail(e.target.value)} />
        </Field>
        <Action
          label={t('Record retraining request')}
          disabled={!q.data?.length || detail.trim().length < 5}
          onClick={async () => {
            await api('/admin/model-events', 'POST', {
              modelId: modelId || q.data?.[0]?.id,
              type: 'RETRAINING_REQUESTED',
              detail,
            });
            setDetail('');
            await q.reload();
          }}
        />
        <p className="muted">
          {t('A request records intent; it does not claim that a model has been trained.')}
        </p>
      </Card>
    </>
  );
}
