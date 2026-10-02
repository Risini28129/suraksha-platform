'use client';
import { t } from '@suraksha/shared';

import { cloneElement, isValidElement, useId, useState } from 'react';
import { readable } from '@suraksha/shared';
import { Activity, FileText, Clock3, ShieldCheck } from 'lucide-react';
export function Badge({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
export function Title({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{subtitle || 'Suraksha safety network'}</p>
      </div>
      {children}
    </header>
  );
}
export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={'card ' + className}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Metrics({ items }: { items: [string, string | number][] }) {
  const icons = [Activity, FileText, Clock3, ShieldCheck];
  return (
    <div className="metrics">
      {items.map(([label, value], i) => (
        <div className="card metric" key={label}>
          <span className={'metric-icon color-' + i}>
            {(() => {
              const Icon = icons[i % icons.length]!;
              return <Icon size={18} aria-hidden="true" />;
            })()}
          </span>
          <div>
            <strong className={String(value).length > 6 ? 'metric-text' : undefined}>
              {value}
            </strong>
            <small>{label}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement<{ id?: string }>(children) ? cloneElement(children, { id }) : children}
    </div>
  );
}
export function State({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  retry?: () => void;
}) {
  if (loading) return <p role="status">{t('Loading your workspace\u2026')}</p>;
  if (error)
    return (
      <div className="error" role="alert">
        {error} {retry && <button onClick={retry}>{t('Try again')}</button>}
      </div>
    );
  if (empty) return <p className="empty">{t('No records to show yet.')}</p>;
  return null;
}
export function Action({
  label,
  onClick,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  label: string;
  onClick: () => Promise<unknown>;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  return (
    <>
      <button
        className={(secondary ? 'secondary ' : '') + (danger ? 'danger' : '')}
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          setError('');
          setSuccess(false);
          try {
            await onClick();
            setSuccess(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Please wait…' : label}
      </button>
      {success && (
        <span className="action-success" role="status">
          Saved successfully
        </span>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function CaseTable({ rows, prefix }: { rows: any[]; prefix: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {['Report', 'Priority', 'Status', 'Assigned handler', 'Filed'].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.reference}>
              <td>
                <a href={`${prefix}/cases/${r.reference}`}>
                  {t('#')}
                  {r.reference}
                </a>
                <small>{readable(r.category)}</small>
              </td>
              <td>
                <Badge tone={r.priority === 'HIGH' ? 'red' : r.priority === 'LOW' ? '' : 'amber'}>
                  {readable(r.priority)}
                </Badge>
              </td>
              <td>
                <Badge>{readable(r.stage)}</Badge>
              </td>
              <td>{r.officer?.name || 'Unassigned'}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <State empty />}
    </div>
  );
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="group" aria-label={t('Filter')}>
      {options.map((x) => (
        <button
          key={x}
          aria-pressed={x === value}
          className={x === value ? 'selected' : ''}
          onClick={() => onChange(x)}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
export function MapPanel({
  positions = [],
}: {
  positions: {
    latitude: number;
    longitude: number;
  }[];
}) {
  return (
    <div className="map" role="img" aria-label={t('Development coordinate map')}>
      <span className="map-label">{t('Development map \u00B7 coordinates only')}</span>
      {positions.map((p, i) => (
        <div
          key={i}
          className="map-marker"
          style={{ left: `${20 + ((i * 18) % 60)}%`, top: `${35 + ((i * 13) % 50)}%` }}
        >
          {t('\u25CF')}
          <small>
            {p.latitude.toFixed(4)}
            {t(',')}
            {p.longitude.toFixed(4)}
          </small>
        </div>
      ))}
    </div>
  );
}
