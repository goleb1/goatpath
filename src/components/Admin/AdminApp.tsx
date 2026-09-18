import { useMemo, useState, useEffect } from 'react';
import { buildShareContent, shareUpdate } from '../../lib/share';
import { deriveEventState, getGoatArtwork } from '../../lib/state';
import { useLiveEvent } from '../../hooks/useLiveEvent';
import type { Event } from '../../types/Event';

type AuthState = 'checking' | 'signed-out' | 'signed-in';
type CommandInput =
  | { type: 'arrive'; stopIndex: number }
  | { type: 'depart'; stopIndex: number }
  | { type: 'message'; message: string }
  | { type: 'adjust_eta'; minutes: number };

interface ApiErrorBody { error?: { code?: string; message?: string } }

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as ApiErrorBody;
  return body.error?.message ?? `Request failed (${response.status}).`;
}

export function AdminApp() {
  const live = useLiveEvent();
  const [eventOverride, setEventOverride] = useState<Event | null>(null);
  const event = eventOverride && eventOverride.revision >= live.event.revision ? eventOverride : live.event;
  const state = useMemo(() => deriveEventState(event, live.now, live.source), [event, live.now, live.source]);
  const [auth, setAuth] = useState<AuthState>('checking');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState(event.customMessage ?? '');
  const [etaMinutes, setEtaMinutes] = useState(String(event.etaAdjustmentMinutes ?? 0));
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [isConflict, setIsConflict] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [manualShareText, setManualShareText] = useState('');
  const currentStop = state.current;
  const nextAction = currentStop?.status === 'pending'
    ? 'arrive'
    : currentStop?.status === 'active'
      ? 'depart'
      : null;
  const phaseLabel = state.phase === 'at_stop' ? 'AT STOP' : state.phase === 'en_route' ? 'EN ROUTE' : state.phase.toUpperCase();
  const shareContent = useMemo(
    () => buildShareContent(event, state, live.now, `${window.location.origin}/`),
    [event, state, live.now],
  );

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as { authenticated?: boolean } | null;
        if (active) setAuth(response.ok && body?.authenticated === true ? 'signed-in' : 'signed-out');
      })
      .catch(() => { if (active) setAuth('signed-out'); });
    return () => { active = false; };
  }, []);

  async function login(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setPending('login');
    setNotice('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setSecret('');
      setAuth('signed-in');
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      setPending(null);
    }
  }

  async function runCommand(command: CommandInput, label: string) {
    setPending(label);
    setNotice('');
    setIsConflict(false);
    try {
      const response = await fetch('/api/admin/action', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...command, expectedRevision: event.revision, commandId: crypto.randomUUID() }),
      });
      if (response.status === 401) {
        setAuth('signed-out');
        throw new Error('Session expired. Sign in again.');
      }
      if (response.status === 409) {
        setEventOverride(null);
        setIsConflict(true);
        throw new Error(await responseError(response));
      }
      if (!response.ok) throw new Error(await responseError(response));
      const body = await response.json() as { event: Event; duplicate: boolean };
      setEventOverride(body.event);
      setMessage(body.event.customMessage ?? '');
      setEtaMinutes(String(body.event.etaAdjustmentMinutes ?? 0));
      setNotice(body.duplicate ? 'Command was already applied.' : `${label} saved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Admin action failed.');
    } finally {
      setPending(null);
    }
  }

  async function logout() {
    setPending('logout');
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
    } finally {
      setAuth('signed-out');
      setPending(null);
    }
  }

  async function shareServiceUpdate() {
    setShareStatus('');
    setManualShareText('');
    try {
      const result = await shareUpdate(shareContent);
      setShareStatus(result === 'shared' ? 'Update shared.' : result === 'copied' ? 'Update copied.' : 'Share cancelled.');
    } catch {
      setShareStatus('Sharing is unavailable. Select and copy the update below.');
      setManualShareText(shareContent.manualText);
    }
  }

  if (auth !== 'signed-in') {
    return <div className="app-shell admin-shell">
      <header className="brand-header"><img className="express-logo" src="/SHBACExpress.png" alt="SHBAC Express" /><img className="goat-logo" src={getGoatArtwork(event.stops)} alt="South Hillbillies goat" /></header>
      <main>
        <section className="admin-card admin-login">
          <div className="section-label">SECURE OPERATOR SIGN-IN</div>
          {auth === 'checking' ? <p role="status">Checking session…</p> : <form onSubmit={login}>
            <label htmlFor="admin-secret">Admin PIN</label>
            <input id="admin-secret" type="password" inputMode="numeric" autoComplete="current-password" required minLength={6} maxLength={128} value={secret} onChange={(input) => setSecret(input.target.value)} />
            <button className="button" disabled={pending === 'login'}>{pending === 'login' ? 'Signing in…' : 'Sign in'}</button>
          </form>}
          {notice && <p className="admin-notice" role="alert">{notice}</p>}
        </section>
      </main>
    </div>;
  }

  return <div className="app-shell admin-shell">
    <header className="brand-header">
      <img className="express-logo" src="/SHBACExpress.png" alt="SHBAC Express" />
      <img className="goat-logo" src={getGoatArtwork(event.stops)} alt="South Hillbillies goat" />
    </header>
    <main>
      <section className="admin-card admin-operator">
        <div className="admin-operator__top">
          <span className="section-label">NEXT ACTION</span>
          <span className={`admin-feed is-${state.freshness}`}>FEED {state.freshness}</span>
        </div>
        <div className="admin-phase">{phaseLabel} · STOP {currentStop ? currentStop.position + 1 : '—'} OF {event.stops.length}</div>
        <h1>{currentStop?.name ?? 'No current stop'}</h1>
        {nextAction === 'arrive' && currentStop && <button className="button admin-primary-action" disabled={pending !== null} onClick={() => runCommand({ type: 'arrive', stopIndex: currentStop.position }, 'Arrival')}>{pending === 'Arrival' ? 'SAVING…' : 'MARK ARRIVED'}</button>}
        {nextAction === 'depart' && currentStop && <button className="button admin-primary-action" disabled={pending !== null} onClick={() => runCommand({ type: 'depart', stopIndex: currentStop.position }, 'Departure')}>{pending === 'Departure' ? 'SAVING…' : 'MARK DEPARTED'}</button>}
        {!nextAction && <div className="admin-complete">No further stop action required.</div>}
        {(state.previous || state.next) && <div className="admin-neighbors">
          {state.previous && <span><small>PREVIOUS</small><strong>{state.previous.name}</strong></span>}
          {state.next && <span><small>NEXT</small><strong>{state.next.name}</strong></span>}
        </div>}
      </section>
      {notice && <div className={isConflict ? 'admin-notice is-conflict' : 'admin-notice'} role="status">{notice}{isConflict && <span> Live data will refresh automatically; verify the current stop before retrying.</span>}</div>}

      <section className="admin-quick-share">
        <button className="button button--secondary" disabled={pending !== null} onClick={shareServiceUpdate}>Share current update</button>
        {shareStatus && <p className="share-status" aria-live="polite">{shareStatus}</p>}
        {manualShareText && <textarea className="manual-share" readOnly aria-label="Service update to copy" value={manualShareText} onFocus={(input) => input.currentTarget.select()} />}
      </section>

      <details className="admin-tools">
        <summary>More controls</summary>
        <section className="admin-card">
          <label className="section-label" htmlFor="message">TEMPORARY SERVICE MESSAGE</label>
          <textarea id="message" maxLength={100} value={message} onChange={(input) => setMessage(input.target.value)} />
          <div className="admin-actions">
            <button className="button" disabled={pending !== null} onClick={() => runCommand({ type: 'message', message }, 'Message')}>Post message</button>
            <button className="button button--secondary" disabled={pending !== null || !event.customMessage} onClick={() => runCommand({ type: 'message', message: '' }, 'Message')}>Clear</button>
          </div>
        </section>
        <section className="admin-card">
          <label className="section-label" htmlFor="eta-adjustment">OPTIONAL ETA ADJUSTMENT</label>
          <select id="eta-adjustment" value={etaMinutes} disabled={pending !== null} onChange={(input) => setEtaMinutes(input.target.value)}>
            <option value="-10">10 min earlier</option><option value="-5">5 min earlier</option><option value="0">No adjustment</option><option value="5">5 min later</option><option value="10">10 min later</option>
          </select>
          <button className="button" disabled={pending !== null} onClick={() => runCommand({ type: 'adjust_eta', minutes: Number(etaMinutes) }, 'ETA adjustment')}>Save ETA adjustment</button>
        </section>
      </details>
      <div className="admin-footer"><a href="/">View public tracker</a><button className="text-button" onClick={logout} disabled={pending !== null}>Sign out</button></div>
    </main>
  </div>;
}
