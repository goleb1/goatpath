import { useMemo, useState } from 'react';
import { selectBestIntercept } from './lib/eta';
import { createServiceReport } from './lib/report';
import { buildShareContent, formatTimeWindow, shareUpdate } from './lib/share';
import { deriveEventState, getGoatArtwork } from './lib/state';
import { useLiveEvent } from './hooks/useLiveEvent';
import { isPreviewMode, previewModes } from './data/previewEvent';
import type { Event, EventViewState, Stop } from './types/Event';

const dateTime = (value: string | undefined, timezone: string) =>
  value
    ? new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(value))
    : '—';

function directionsUrl(stop: Stop | null) {
  return stop?.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`
    : null;
}

function statusContent(event: Event, state: EventViewState) {
  const name = state.current?.name ?? 'the route';
  if (state.phase === 'at_stop') return { eyebrow: 'NOW AT', title: name, body: `Arrived ${dateTime(state.current?.arrivalTime, event.timezone)} · stop clock is running.` };
  if (state.phase === 'en_route') return { eyebrow: 'EN ROUTE TO', title: name, body: `Departed ${state.previous?.name ?? 'the previous stop'} at ${dateTime(state.previous?.departureTime, event.timezone)}.` };
  if (state.phase === 'complete') return { eyebrow: 'SERVICE COMPLETE', title: name, body: 'The herd reached the end of the line.' };
  return { eyebrow: 'FRIDAY · SEPTEMBER 18', title: `Meet at ${event.stops[0]?.name ?? 'the starting stop'}`, body: 'Arrive about 5:00 p.m. · planned departure about 5:30 p.m. Eastern.' };
}

function FreshnessStrip({ state, timezone }: { state: EventViewState; timezone: string }) {
  const updated = state.updatedAt
    ? new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(state.updatedAt)
    : null;
  const messages = {
    live: state.phase === 'pregame' ? 'SCHEDULE POSTED' : `LIVE · UPDATED ${updated ?? 'JUST NOW'}`,
    stale: `UPDATE DELAYED · LAST KNOWN ${updated ?? 'UNKNOWN'}`,
    offline: 'OFFLINE · SHOWING SCHEDULE OR LAST KNOWN SERVICE',
    error: 'LIVE FEED ERROR · SHOWING LAST KNOWN SERVICE',
  };
  return <div className={`freshness freshness--${state.freshness}`} role="status">{messages[state.freshness]}</div>;
}

function StopLine({ state }: { state: EventViewState }) {
  const rows = [
    { label: 'Previous', stop: state.previous },
    { label: state.phase === 'en_route' ? 'Destination' : 'Current', stop: state.current },
    { label: 'Next', stop: state.next },
  ].filter((row) => row.stop);
  return <section className="stop-line" aria-label="Nearby route stops">
    {rows.map((row, index) => <div className={row.stop?.id === state.current?.id ? 'stop-line__row is-current' : 'stop-line__row'} key={row.stop?.id}>
      <span className="stop-line__track"><i />{index < rows.length - 1 && <b />}</span>
      <span><small>{row.label}</small><strong>{row.stop?.name}</strong></span>
    </div>)}
  </section>;
}

function RouteDetails({ event, state }: { event: Event; state: EventViewState }) {
  const legLabel = (stop: Stop) => {
    if (stop.status === 'completed') return 'complete';
    if (stop.status === 'active') return 'here now';
    if (stop.distanceToNextMiles == null) return 'final stop';
    return `${Number(stop.distanceToNextMiles.toFixed(2))} mi to next`;
  };
  return <details className="route-card">
    <summary><span>Full route</span><span>{event.stops.filter((stop) => stop.status === 'completed').length}/{event.stops.length} stops</span></summary>
    <ol>
      {event.stops.map((stop) => <li className={stop.id === state.current?.id ? 'is-current' : ''} key={stop.id}>
        <span>{String(stop.position + 1).padStart(2, '0')} · {stop.name}</span>
        <small>{legLabel(stop)}</small>
      </li>)}
    </ol>
    <p className="data-note">Leg distances follow the official 10.1-mile GPX route. Directions appear when the private event feed is connected.</p>
  </details>;
}

function ServiceReport({ event }: { event: Event }) {
  const report = createServiceReport(event);
  const mins = (value: number | null) => value == null ? 'Not recorded' : `${Math.round(value)} min`;
  return <section className="report-card">
    <div className="section-label">END-OF-EVENT SERVICE REPORT</div>
    <div className="report-grid">
      <span>Total elapsed<strong>{mins(report.totalElapsedMinutes)}</strong></span>
      <span>Recorded dwell<strong>{mins(report.recordedDwellMinutes)}</strong></span>
      <span>Longest stop<strong>{report.longestStop ? `${report.longestStop.stop.name} · ${mins(report.longestStop.minutes)}` : 'Not recorded'}</strong></span>
      <span>Fastest leg<strong>{report.fastestLeg ? `${report.fastestLeg.from.name} → ${report.fastestLeg.to.name}` : 'Needs distances'}</strong></span>
      <span>Schedule delay<strong>{report.biggestScheduleDelayMinutes == null ? 'No planned stop times' : mins(report.biggestScheduleDelayMinutes)}</strong></span>
    </div>
    <div className="report-board">
      {event.stops.map((stop) => <div key={stop.id}><strong>{stop.name}</strong><span>Arr {dateTime(stop.arrivalTime, event.timezone)}</span><span>Dep {dateTime(stop.departureTime, event.timezone)}</span></div>)}
    </div>
    <button className="button button--secondary" onClick={() => window.print()}>Download / print report</button>
  </section>;
}

export default function PublicApp() {
  const { event, source, now } = useLiveEvent();
  const state = useMemo(() => deriveEventState(event, now, source), [event, now, source]);
  const intercept = useMemo(() => selectBestIntercept(event, state, now), [event, state, now]);
  const hero = statusContent(event, state);
  const [shareStatus, setShareStatus] = useState('');
  const [manualShareText, setManualShareText] = useState('');
  const eta = formatTimeWindow(intercept.arrivalWindow, event.timezone);
  const etaIsPast = Boolean(intercept.arrivalWindow && intercept.arrivalWindow.end.getTime() < now.getTime());
  const direction = directionsUrl(intercept.stop);
  const previewMode = new URLSearchParams(window.location.search).get('preview');
  const isDesignPreview = isPreviewMode(previewMode);

  const handleShare = async () => {
    const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? `${window.location.origin}/`;
    const content = buildShareContent(event, state, intercept.arrivalWindow, canonicalUrl);
    setManualShareText('');
    try {
      const result = await shareUpdate(content);
      setShareStatus(result === 'shared' ? 'Update shared.' : result === 'copied' ? 'Update copied.' : 'Share cancelled.');
    } catch {
      setShareStatus('Sharing is unavailable. Select and copy the update below.');
      setManualShareText(content.manualText);
    }
  };

  return <div className="app-shell">
    {isDesignPreview && <nav className="preview-switcher" aria-label="Design preview states">
      <strong>DESIGN PREVIEW</strong>
      <div>{previewModes.map((mode) => <a className={mode === previewMode ? 'is-active' : ''} href={`?preview=${mode}`} key={mode}>{mode.replace('-', ' ')}</a>)}</div>
    </nav>}
    <header className="brand-header">
      <img className="express-logo" src="/SHBACExpress.png" alt="SHBAC Express" />
      <div className="event-mark"><span>GOATPATH · 2026</span><img src={getGoatArtwork(event.stops)} alt="South Hillbillies goat" /></div>
    </header>
    <FreshnessStrip state={state} timezone={event.timezone} />
    {event.customMessage && <div className="service-message">SERVICE MESSAGE · {event.customMessage}</div>}
    <main>
      <section className="hero">
        <span className="section-label">{hero.eyebrow}</span>
        <h1>{hero.title}</h1>
        <p>{hero.body}</p>
      </section>

      <section className="intercept-card">
        <span className="section-label">BEST INTERCEPT</span>
        <h2>{intercept.stop?.name ?? 'No stop available'}</h2>
        <p>{intercept.reason}</p>
        <p className="eta">{
          state.phase === 'complete' && eta
            ? `Arrived ${eta}`
            : etaIsPast && eta
              ? `Last estimate ${eta} · now overdue.`
              : eta
                ? `Expected arrival ${eta}`
                : 'ETA unavailable — route distance or pace is not yet configured.'
        }</p>
        {direction ? <a className="button" href={direction} target="_blank" rel="noreferrer">Get directions</a> : <button className="button" disabled>Directions pending address</button>}
      </section>

      <StopLine state={state} />
      <RouteDetails event={event} state={state} />
      {state.phase === 'complete' && <ServiceReport event={event} />}

      <div className="actions">
        <button className="button button--secondary" onClick={handleShare}>Share service update</button>
        <a className="button button--strava" href={event.stravaRouteUrl} target="_blank" rel="noreferrer">View the ~10-mile route on Strava</a>
        <span className="share-status" aria-live="polite">{shareStatus}</span>
        {manualShareText && <textarea className="manual-share" readOnly aria-label="Service update to copy" value={manualShareText} onFocus={(event) => event.currentTarget.select()} />}
      </div>
    </main>
    <footer>9TH ANNUAL LE TOUR DE SOUTH HILLBILLIES · POINT-TO-POINT</footer>
  </div>;
}
