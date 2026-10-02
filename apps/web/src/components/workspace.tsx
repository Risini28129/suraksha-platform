'use client';
import { t, setLocale } from '@suraksha/shared';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Radio,
  MapPin,
  UserRound,
  MessageSquare,
  BookOpen,
  Heart,
  LogOut,
} from 'lucide-react';
import { api, apiBase } from '../lib/api';
import { roleHome, Role, SafeUser } from '@suraksha/types';
import { SignIn } from '../features/sign-in';
import { AdminOverview, UserManagement, Moderation, ModelMonitoring } from '../features/admin';
import { CaseList, CaseDetail, CaseStatus } from '../features/cases';
import { PoliceLive, PoliceMap } from '../features/police';
import {
  CounselingDashboard,
  ClientList,
  ClientSnapshot,
  SessionNotes,
} from '../features/counseling';
import { LegalDashboard, LegalResources } from '../features/legal';
import { State, Title, Card, Action } from './ui';
const nav: Record<string, [string, string, typeof Users][]> = {
  ADMIN: [
    ['Dashboard', '/admin', LayoutDashboard],
    ['Reports', '/admin/reports', FileText],
    ['Users', '/admin/users', Users],
    ['Moderation', '/admin/moderation', ShieldCheck],
    ['Settings', '/admin/settings/models', Settings],
  ],
  POLICE: [
    ['Live', '/police/live', Radio],
    ['Cases', '/police/cases', FileText],
    ['Map', '/police/map', MapPin],
    ['Profile', '/police/profile', UserRound],
  ],
  COUNSELOR: [
    ['Sessions', '/counselor/sessions', Heart],
    ['Clients', '/counselor/clients', Users],
    ['Messages', '/counselor/messages', MessageSquare],
    ['Profile', '/counselor/profile', UserRound],
  ],
  LEGAL_ADVISOR: [
    ['Queries', '/legal/queries', MessageSquare],
    ['Resources', '/legal/resources', BookOpen],
    ['Impact', '/legal/impact', LayoutDashboard],
    ['Profile', '/legal/profile', UserRound],
  ],
};
export function Workspace({ path }: { path: string }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setLocale(user?.locale || 'en');
  }, [user?.locale]);
  useEffect(() => {
    api<SafeUser>('/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    const events = new EventSource(apiBase + '/events', { withCredentials: true });
    events.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'session.expired') {
        setUser(null);
        events.close();
      }
      if (data.events?.length) setRevision((x) => x + 1);
    };
    return () => events.close();
  }, [user]);
  if (loading)
    return (
      <main className="center">
        <State loading />
      </main>
    );
  if (!user)
    return (
      <SignIn
        path={path}
        onSignedIn={(u) => {
          setUser(u);
          window.location.assign(roleHome[u.role]);
        }}
      />
    );
  if (user.role === 'USER')
    return (
      <main className="center">
        <h1>{t('Use the Suraksha mobile application')}</h1>
        <Action
          label={t('Sign out')}
          onClick={() => api('/auth/logout', 'POST').then(() => setUser(null))}
        />
      </main>
    );
  const prefix = roleHome[user.role].split('/')[1];
  if (path !== '/' && path.split('/')[1] !== prefix)
    return (
      <main className="center">
        <h1>{t('403 \u2014 Workspace restricted')}</h1>
        <a href={roleHome[user.role]}>{t('Return to your workspace')}</a>
      </main>
    );
  const effective = path === '/' ? roleHome[user.role] : path;
  let content: React.ReactNode;
  const segments = effective.split('/').filter(Boolean);
  const ref = segments[2] || '';
  if (effective.endsWith('/profile'))
    content = (
      <>
        <Title title={t('Profile')} />
        <Card title={user.name}>
          <p>{user.role}</p>
          <p>
            {t('Verified staff access:')}
            {user.verified ? 'Verified' : 'Pending'}
          </p>
          <p>
            {t('Development account:')}
            {user.demo ? 'Yes' : 'No'}
          </p>
        </Card>
      </>
    );
  else if (user.role === 'ADMIN') {
    if (segments[1] === 'users') content = <UserManagement />;
    else if (segments[1] === 'moderation') content = <Moderation />;
    else if (segments[1] === 'settings') content = <ModelMonitoring />;
    else if (segments[1] === 'cases') content = <CaseDetail reference={ref} role="ADMIN" />;
    else if (segments[1] === 'reports') content = <CaseList role="ADMIN" />;
    else content = <AdminOverview name={user.name} />;
  } else if (user.role === 'POLICE') {
    if (segments[1] === 'cases' && ref)
      content =
        segments[3] === 'status' ? (
          <CaseStatus reference={ref} />
        ) : (
          <CaseDetail reference={ref} role="POLICE" />
        );
    else if (segments[1] === 'cases') content = <CaseList role="POLICE" />;
    else if (segments[1] === 'map') content = <PoliceMap />;
    else content = <PoliceLive />;
  } else if (user.role === 'COUNSELOR') {
    if (segments[1] === 'clients' && ref) content = <ClientSnapshot id={ref} />;
    else if (segments[1] === 'clients') content = <ClientList />;
    else if (segments[1] === 'sessions' && ref) content = <SessionNotes id={ref} />;
    else content = <CounselingDashboard messagesOnly={segments[1] === 'messages'} />;
  } else
    content =
      segments[1] === 'resources' ? (
        <LegalResources />
      ) : (
        <LegalDashboard impactOnly={segments[1] === 'impact'} />
      );
  const known =
    /^\/(admin(?:\/(?:reports|users|moderation|settings\/models|cases\/[^/]+|sign-in))?|police\/(?:live|map|profile|sign-in|cases(?:\/[^/]+(?:\/status)?)?)|counselor\/(?:sessions(?:\/[^/]+\/notes)?|clients(?:\/[^/]+)?|messages|profile|sign-in)|legal\/(?:queries|resources|impact|profile|sign-in))$/.test(
      effective,
    );
  if (!known)
    return (
      <main className="center">
        <h1>404 — Page not found</h1>
        <a href={roleHome[user.role]}>Return to your workspace</a>
      </main>
    );
  return (
    <div className={'shell staff-shell role-' + user.role}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href={roleHome[user.role]}>
          <ShieldCheck /> <span>{t('SURAKSHA')}</span>
        </a>
        <small className="nav-label">{user.role.replaceAll('_', ' ')}</small>
        <nav>
          {nav[user.role]?.map(([label, href, Icon]) => (
            <a
              key={href}
              className={
                effective === href ||
                (href !== roleHome[user.role] && effective.startsWith(href + '/')) ||
                (href === '/admin/reports' && effective.startsWith('/admin/cases/'))
                  ? 'active'
                  : ''
              }
              aria-current={
                effective === href ||
                (href !== roleHome[user.role] && effective.startsWith(href + '/')) ||
                (href === '/admin/reports' && effective.startsWith('/admin/cases/'))
                  ? 'page'
                  : undefined
              }
              href={href}
            >
              <Icon size={21} />
              {label}
            </a>
          ))}
        </nav>
        {user.role === 'ADMIN' && (
          <div className="sidebar-note">
            <ShieldCheck size={28} />
            <strong>Care begins with you.</strong>
            <p>A safer community, one thoughtful action at a time.</p>
            <a href="/admin/reports">
              Review reports <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
        <footer>
          <span className="avatar">{user.name.charAt(0)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.role.replaceAll('_', ' ')}
              {user.verified ? ' · Verified' : ' · Pending'}
            </small>
          </div>
          <button
            className="icon-button"
            aria-label={t('Sign out')}
            onClick={async () => {
              await api('/auth/logout', 'POST');
              setUser(null);
            }}
          >
            <LogOut size={16} />
          </button>
        </footer>
      </aside>
      <main className="workspace" id="main-content">
        {
          <div className="admin-topbar">
            <div>
              <span className="eyebrow">SURAKSHA WORKSPACE</span>
              <strong>Community care, connected.</strong>
            </div>
            <div className="topbar-account">
              <span className="status-dot" /> {user.demo ? 'Demo workspace' : 'Staff workspace'}
              <span className="avatar">{user.name.charAt(0)}</span>
              <button
                className="icon-button"
                aria-label="Sign out of workspace"
                onClick={async () => {
                  await api('/auth/logout', 'POST');
                  setUser(null);
                }}
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        }
        <div className="environment">
          <span>{t('RESEARCH PROTOTYPE')}</span>
          {t('Development delivery \u00B7 no emergency services connected')}
          <select
            aria-label="Interface language"
            value={user.locale}
            onChange={async (e) => {
              setUser(await api('/me/preferences', 'PATCH', { locale: e.target.value }));
            }}
            style={{ width: 120 }}
          >
            <option value="en">English</option>
            <option value="si">සිංහල</option>
            <option value="ta">தமிழ்</option>
          </select>
          {user.locale !== 'en' && <small>English fallback · verified translations pending</small>}
          <span className="online">{t('\u25CF Connected account')}</span>
        </div>
        <div key={revision}>{content}</div>
      </main>
    </div>
  );
}
export type { Role };
