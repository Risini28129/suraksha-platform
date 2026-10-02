'use client';
import { t } from '@suraksha/shared';

import { useState } from 'react';
import { api, download, useData } from '../lib/api';
import {
  Title,
  Card,
  Metrics,
  State,
  CaseTable,
  Tabs,
  Badge,
  Field,
  Action,
  MapPanel,
} from '../components/ui';
import { readable } from '@suraksha/shared';
import type { CaseView } from '@suraksha/types';
function exportReports(rows: CaseView[]) {
  const values = [
    ['Reference', 'Category', 'Priority', 'Status', 'Handler'],
    ...rows.map((r) => [
      r.reference,
      readable(r.category),
      r.priority,
      r.stage,
      r.officer?.name || 'Unassigned',
    ]),
  ];
  const csv = values
    .map((row) =>
      row
        .map((value) => {
          const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
          return '"' + safe.replaceAll('"', '""') + '"';
        })
        .join(','),
    )
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'suraksha-reports.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function matchesAdminTab(r: CaseView, tab: string) {
  if (tab === 'All reports') return true;
  if (tab === 'New') return r.triage === 'NEW' || (r.stage === 'FILED' && !r.officer);
  if (tab === 'In review') return r.triage === 'IN_REVIEW';
  if (tab === 'Escalated') return r.escalated;
  if (tab === 'Unassigned') return !r.officer;
  if (tab === 'Resolved') return r.stage === 'RESOLVED';
  return true;
}

export function CaseList({ role }: { role: 'ADMIN' | 'POLICE' }) {
  const q = useData<CaseView[]>('/cases');
  const adminTabs = ['All reports', 'New', 'In review', 'Escalated', 'Unassigned', 'Resolved'];
  const policeTabs = [
    'All reports',
    'Filed',
    'Under investigation',
    'Escalated',
    'Unassigned',
    'Resolved',
  ];
  const [tab, setTab] = useState('All reports');
  const [search, setSearch] = useState('');
  const rows = (q.data || []).filter(
    (r) =>
      (role === 'ADMIN'
        ? matchesAdminTab(r, tab)
        : tab === 'All reports' ||
          (tab === 'Unassigned' && !r.officer) ||
          (tab === 'Escalated' && r.escalated) ||
          readable(r.stage) === tab) &&
      `${r.reference} ${readable(r.category)} ${r.officer?.name || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const resolvedToday =
    q.data?.filter(
      (r) =>
        r.stage === 'RESOLVED' &&
        r.events?.some((e) => ['RESOLVE', 'RESOLVED'].includes(e.type) && isToday(e.createdAt)),
    ).length || 0;
  return (
    <>
      <Title
        title={role === 'ADMIN' ? 'Reports Queue' : 'Assigned Cases'}
        subtitle="Review, assign and follow every report through to resolution."
      >
        <input
          aria-label={t('Search cases')}
          placeholder={t('Search report ID, category\u2026')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Title>
      <Metrics
        items={[
          ['Open reports', q.data?.filter((r) => r.stage !== 'RESOLVED').length || 0],
          ['High priority', q.data?.filter((r) => r.priority === 'HIGH').length || 0],
          ['Escalated', q.data?.filter((r) => r.escalated).length || 0],
          [
            role === 'ADMIN' ? 'Resolved today' : 'Resolved',
            role === 'ADMIN'
              ? resolvedToday
              : q.data?.filter((r) => r.stage === 'RESOLVED').length || 0,
          ],
        ]}
      />
      <Card>
        <div className="table-toolbar">
          <div>
            <h2>All incident reports</h2>
            <p className="muted">{rows.length} reports in this view</p>
          </div>
          <button className="secondary" onClick={() => exportReports(rows)}>
            Export CSV
          </button>
        </div>
        <Tabs options={role === 'ADMIN' ? adminTabs : policeTabs} value={tab} onChange={setTab} />
        <State {...q} retry={q.reload} />
        <CaseTable rows={rows} prefix={role === 'ADMIN' ? '/admin' : '/police'} />
      </Card>
    </>
  );
}
export function CaseDetail({ reference, role }: { reference: string; role: 'ADMIN' | 'POLICE' }) {
  const q = useData<CaseView>('/cases/' + reference);
  const users = useData<any[]>(role === 'ADMIN' ? '/admin/users' : null);
  const [officer, setOfficer] = useState('');
  const [mutationBusy, setMutationBusy] = useState(false);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const messages = useData<any[]>(role === 'POLICE' ? `/cases/${reference}/messages` : null);
  if (!q.data) return <State {...q} retry={q.reload} />;
  const c = q.data;
  const action = async (type: string) => {
    setMutationBusy(true);
    try {
      await api(`/cases/${reference}/actions`, 'POST', { type, note, expectedVersion: c.version });
      setNote('');
      await q.reload();
    } finally {
      setMutationBusy(false);
    }
  };
  return (
    <>
      <a className="back" href={role === 'ADMIN' ? '/admin/reports' : '/police/cases'}>
        {t('\u2039 Back to')} {role === 'ADMIN' ? 'Reports Queue' : 'Cases'}
      </a>
      <Title title={'Case #' + reference}>
        <Badge tone={c.priority === 'HIGH' ? 'red' : 'amber'}>
          {readable(c.priority)} {t('priority')}
        </Badge>
      </Title>
      <div className="detail-grid">
        <div>
          <div className="risk-banner">
            <strong>{t('AI Risk Assessment')}</strong>
            <p>
              {c.analysis?.length
                ? 'Review the recorded model assessment and its validation status.'
                : 'No validated AI assessment available. Review the submitted evidence and narrative.'}
            </p>
          </div>
          <Card title={t('Evidence bundle')}>
            <State empty={!c.evidence?.length} />
            {c.evidence?.map((e) => (
              <div className="queue-row" key={e.id}>
                <div>
                  <strong>{e.filename}</strong>
                  <small>{e.sha256}</small>
                  <Badge>{t('Sealed \u00B7 SHA-256 recorded')}</Badge>
                </div>
                <Action secondary label={t('Verify & download')} onClick={() => download(e.id)} />
              </div>
            ))}
          </Card>
          {role === 'POLICE' && (
            <Card title={t('Location trail')}>
              {c.locations?.length ? (
                <>
                  <MapPanel positions={c.locations} />
                  <ol className="timeline">
                    {c.locations.map((p) => (
                      <li key={p.id}>
                        <strong>
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </strong>
                        <small>
                          {p.source} · ±{Math.round(p.accuracy)}m ·{' '}
                          {new Date(p.capturedAt).toLocaleString()}
                        </small>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p>
                  {t(
                    'No location trail is attached to this case. Only explicitly shared incident locations may be shown.',
                  )}
                </p>
              )}
            </Card>
          )}
          <Card title={t('Report narrative')}>
            <p className="narrative">{c.narrative || 'No description supplied.'}</p>
          </Card>
          <Card title={role === 'POLICE' ? 'Timeline' : 'Case activity'}>
            <ol className="timeline">
              {c.events?.map((e) => (
                <li key={e.id}>
                  <strong>{e.publicText}</strong>
                  <small>{new Date(e.createdAt).toLocaleString()}</small>
                  {e.privateNote && <p>{e.privateNote}</p>}
                </li>
              ))}
            </ol>
          </Card>
          {role === 'POLICE' && (
            <Card title={t('Secure case messages')}>
              {messages.data?.map((x) => (
                <p className="message" key={x.id}>
                  {x.body}
                </p>
              ))}
              <Field label={t('Message to reporter')}>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <Action
                label={t('Send message')}
                onClick={async () => {
                  await api(`/cases/${reference}/messages`, 'POST', { body: message });
                  setMessage('');
                  await messages.reload();
                }}
              />
            </Card>
          )}
        </div>
        <aside>
          <Card title={t('Case details')}>
            <dl>
              <dt>{t('Status')}</dt>
              <dd>{readable(c.stage)}</dd>
              <dt>{t('Category')}</dt>
              <dd>{readable(c.category)}</dd>
              <dt>{t('Filer')}</dt>
              <dd>{c.reporter}</dd>
              <dt>{t('Officer')}</dt>
              <dd>{c.officer?.name || 'Unassigned'}</dd>
              <dt>{t('Filed')}</dt>
              <dd>{new Date(c.createdAt).toLocaleString()}</dd>
            </dl>
            {role === 'ADMIN' ? (
              <>
                <Field label={t('Assign to Police')}>
                  <select value={officer} onChange={(e) => setOfficer(e.target.value)}>
                    <option value="">{t('Choose verified officer')}</option>
                    {users.data
                      ?.filter((u) => u.role === 'POLICE' && u.verified && u.status === 'ACTIVE')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Action
                  label={t('Assign to Police')}
                  disabled={mutationBusy || !officer || c.stage === 'RESOLVED'}
                  onClick={async () => {
                    setMutationBusy(true);
                    try {
                      await api(`/cases/${reference}/assignment`, 'POST', {
                        officerId: officer,
                        expectedVersion: c.version,
                      });
                      await q.reload();
                    } finally {
                      setMutationBusy(false);
                    }
                  }}
                />
              </>
            ) : (
              <a className="button blue full" href={`/police/cases/${reference}/status`}>
                {t('Update case status')}
              </a>
            )}
            <Field label={role === 'ADMIN' ? 'Internal note' : 'Investigation note'}>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="stack">
              <Action
                secondary
                disabled={mutationBusy || !note.trim()}
                label={t('Save note')}
                onClick={() => action('INTERNAL_NOTE')}
              />
              <Action
                secondary
                disabled={mutationBusy}
                label={role === 'ADMIN' ? 'Request more info' : 'Request additional evidence'}
                onClick={() => action('REQUEST_INFO')}
              />
              {role === 'ADMIN' && (
                <Action
                  disabled={mutationBusy || c.stage === 'RESOLVED'}
                  label={t('Mark as resolved')}
                  onClick={() => action('RESOLVE')}
                />
              )}
              <Action
                secondary
                danger
                disabled={mutationBusy || c.escalated}
                label={role === 'ADMIN' ? 'Escalate immediately' : 'Escalate to CID'}
                onClick={() => action('ESCALATE')}
              />
            </div>
            <p className="muted">
              {t(
                'Escalation is recorded in this platform. External CID dispatch is not connected.',
              )}
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
export function CaseStatus({ reference }: { reference: string }) {
  const q = useData<CaseView>('/cases/' + reference);
  const [stage, setStage] = useState('');
  const [notes, setNotes] = useState('');
  const stages = ['FILED', 'UNDER_INVESTIGATION', 'SUSPECT_CONTACTED', 'RESOLVED'] as const;
  const current = stage || q.data?.stage || 'FILED';
  const currentIndex = stages.indexOf(current as (typeof stages)[number]);
  return (
    <div className="narrow">
      <a href={'/police/cases/' + reference}>
        {t('\u2039 Back to Case #')}
        {reference}
      </a>
      <Title title={t('Update status')} subtitle={'Investigation progress · Case #' + reference} />
      <Card title={t('Select current stage')}>
        <State {...q} retry={q.reload} />
        <div className="stage-stepper" role="radiogroup" aria-label={t('Investigation stage')}>
          {stages.map((x, i) => (
            <button
              key={x}
              type="button"
              className={
                'stage-step' + (current === x ? ' active' : '') + (i < currentIndex ? ' done' : '')
              }
              onClick={() => setStage(x)}
            >
              <span className="stage-index">{i + 1}</span>
              <span>
                {readable(x)}
                {q.data?.stage === x && <small>{t('Current stage')}</small>}
              </span>
            </button>
          ))}
        </div>
        <Field label={t('Investigation notes')}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
        </Field>
        <div className="actions">
          <a className="button secondary" href={'/police/cases/' + reference}>
            {t('Cancel')}
          </a>
          <Action
            label={t('Save update')}
            onClick={async () => {
              await api(`/cases/${reference}/status`, 'PATCH', {
                stage: current,
                notes,
                expectedVersion: q.data?.version,
              });
              window.location.assign('/police/cases/' + reference);
            }}
          />
        </div>
      </Card>
    </div>
  );
}
