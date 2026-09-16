import { useEffect, useMemo, useState } from 'react';
import { selectBestIntercept } from './lib/eta';
import { createServiceReport } from './lib/report';
import { formatTimeWindow } from './lib/share';
import { deriveEventState, getGoatArtwork } from './lib/state';
import { useLiveEvent } from './hooks/useLiveEvent';
import { isPreviewMode, previewModes } from './data/previewEvent';
import type { Event, EventViewState, Stop } from './types/Event';

const dateTime = (value: string | undefined, timezone: string) =>
  value
    ? new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(value))
    : '—';

const compactMiles = (miles: number) => `${miles.toFixed(1)} mi`;

function directionsUrl(stop: Stop | null) {
  return stop?.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`
    : null;
}

function statusContent(event: Event, state: EventViewState) {
  const name = state.current?.name ?? 'the route';
  if (state.phase === 'at_stop') return { eyebrow: 'NOW AT', title: name, body: `Arrived ${dateTime(state.current?.arrivalTime, event.timezone)}` };
  if (state.phase === 'en_route') return { eyebrow: 'EN ROUTE TO', title: name, body: `Departed ${state.previous?.name ?? 'the previous stop'} at ${dateTime(state.previous?.departureTime, event.timezone)}` };
  if (state.phase === 'complete') return { eyebrow: 'SERVICE COMPLETE', title: name, body: 'The herd reached the end of the line.' };
  return { eyebrow: 'FRIDAY · SEPTEMBER 18', title: `Meet at ${event.stops[0]?.name ?? 'the starting stop'}`, body: 'Arrive around 5:00pm · departing at 5:30pm' };
}

function serviceMessage(event: Event, state: EventViewState) {
  if (state.freshness === 'stale') return `SERVICE CHECK · ${state.current?.name ?? 'CURRENT LOCATION'} IS THE LAST CONFIRMED STOP`;
  if (state.freshness === 'offline') return 'OFFLINE · SHOWING LAST KNOWN SERVICE';
  if (state.freshness === 'error') return 'SIGNAL TROUBLE · SHOWING LAST KNOWN SERVICE';
  if (event.customMessage) return `SERVICE NOTICE · ${event.customMessage}`;
  if (state.phase === 'pregame') return 'ALL ABOARD · BAIRD TERMINAL DEPARTS 5:30PM';
  if (state.phase === 'complete') return 'END OF THE LINE · THANKS FOR RIDING SHBAC EXPRESS';
  if (state.phase === 'at_stop') {
    const distance = state.current?.distanceToNextMiles;
    return state.next
      ? `NOW AT ${state.current?.name.toUpperCase()} · NEXT ${state.next.name.toUpperCase()}${distance == null ? '' : ` · ${compactMiles(distance)}`}`
      : `NOW AT ${state.current?.name.toUpperCase()} · FINAL STOP`;
  }
  const distance = state.previous?.distanceToNextMiles;
  return `EXPRESS SERVICE TO ${state.current?.name.toUpperCase()}${distance == null ? '' : ` · ${compactMiles(distance)}`}`;
}

function ServiceStrip({ event, state }: { event: Event; state: EventViewState }) {
  return <div className={`service-strip service-strip--${state.freshness}`} role="status">{serviceMessage(event, state)}</div>;
}

const elapsedLabel = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
};

function JourneySignal({ event, state }: { event: Event; state: EventViewState }) {
  const [clock, setClock] = useState(() => new Date());
  const active = state.phase === 'at_stop' || state.phase === 'en_route';

  useEffect(() => {
    if (!active) return;
    setClock(new Date());
    const interval = window.setInterval(() => setClock(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, [active, state.current?.id]);

  if (!active) return null;
  const startedAt = state.phase === 'at_stop' ? state.current?.arrivalTime : state.previous?.departureTime;
  if (!startedAt) return null;
  const elapsedSeconds = Math.max(0, Math.floor((clock.getTime() - new Date(startedAt).getTime()) / 1_000));

  if (state.phase === 'en_route') {
    return <section className="journey-signal journey-signal--running" aria-label={`Running for ${elapsedLabel(elapsedSeconds)}`}>
      <div className="journey-signal__meta"><span>RUNNING</span><strong>{elapsedLabel(elapsedSeconds)} EN ROUTE</strong></div>
      <div className="running-dots" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 90}ms` }} />)}
      </div>
    </section>;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const overtime = elapsedMinutes >= event.defaultDwellMinutes;
  return <section className={`journey-signal journey-signal--station${overtime ? ' is-overtime' : ''}`} aria-label={`${elapsedLabel(elapsedSeconds)} at this stop`}>
    <div className="journey-signal__meta"><span>STATION TIMER</span><strong>{elapsedLabel(elapsedSeconds)} AT STOP</strong></div>
    <div className="station-dots" aria-hidden="true">
      {Array.from({ length: event.defaultDwellMinutes }, (_, index) => {
        const stateClass = overtime ? 'is-overtime' : index < elapsedMinutes ? 'is-elapsed' : index === elapsedMinutes ? 'is-current' : '';
        return <i className={stateClass} key={index} />;
      })}
    </div>
  </section>;
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
    return `${stop.distanceToNextMiles.toFixed(1)} mi to next`;
  };
  return <details className="route-card">
    <summary>
      <span>Full route</span>
      <span className="route-card__summary-meta">
        <span>{event.stops.filter((stop) => stop.status === 'completed').length}/{event.stops.length} stops</span>
        <svg className="route-card__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" /></svg>
      </span>
    </summary>
    <ol>
      {event.stops.map((stop) => <li className={stop.id === state.current?.id ? 'is-current' : ''} key={stop.id}>
        <span>{String(stop.position + 1).padStart(2, '0')} · {stop.name}</span>
        <small>{legLabel(stop)}</small>
      </li>)}
    </ol>
    <p className="data-note">Leg distances follow the official 10.1-mile GPX route. Directions appear when the private event feed is connected.</p>
  </details>;
}

const duration = (value: number | null) => {
  if (value == null) return 'Not recorded';
  const rounded = Math.round(value);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
};

const pace = (minutesPerMile: number) => {
  const totalSeconds = Math.round(minutesPerMile * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}/mi`;
};

function ServiceReport({ event }: { event: Event }) {
  const report = createServiceReport(event);
  return <section className="report-card">
    <div className="section-label">END-OF-EVENT SERVICE REPORT</div>
    <div className="report-grid">
      <span>Total elapsed<strong>{duration(report.totalElapsedMinutes)}</strong></span>
      <span>Running time<strong>{duration(report.recordedRunningMinutes)}</strong></span>
      <span>Station time<strong>{duration(report.recordedStationMinutes)}</strong></span>
      <span>Longest stop<strong>{report.longestStop ? `${report.longestStop.stop.name} · ${duration(report.longestStop.minutes)}` : 'Not recorded'}</strong></span>
      <span>Fastest leg<strong>{report.fastestLeg ? `${report.fastestLeg.from.name} → ${report.fastestLeg.to.name} · ${pace(report.fastestLeg.minutesPerMile)}` : 'Needs distances'}</strong></span>
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
  const eta = formatTimeWindow(intercept.arrivalWindow, event.timezone);
  const etaIsPast = Boolean(intercept.arrivalWindow && intercept.arrivalWindow.end.getTime() < now.getTime());
  const direction = directionsUrl(intercept.stop);
  const previewMode = new URLSearchParams(window.location.search).get('preview');
  const isDesignPreview = isPreviewMode(previewMode);

  return <div className="app-shell">
    {isDesignPreview && <nav className="preview-switcher" aria-label="Design preview states">
      <strong>DESIGN PREVIEW</strong>
      <div>{previewModes.map((mode) => <a className={mode === previewMode ? 'is-active' : ''} href={`?preview=${mode}`} key={mode}>{mode.replace('-', ' ')}</a>)}</div>
    </nav>}
    <header className="brand-header">
      <img className="express-logo" src="/SHBACExpress.png" alt="SHBAC Express" />
      <img className="goat-logo" src={getGoatArtwork(event.stops)} alt="South Hillbillies goat" />
    </header>
    <ServiceStrip event={event} state={state} />
    <main>
      <section className="hero">
        <span className="section-label">{hero.eyebrow}</span>
        <h1>{hero.title}</h1>
        <p>{hero.body}</p>
      </section>

      <JourneySignal event={event} state={state} />

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
        <a className="button button--strava" href={event.stravaRouteUrl} target="_blank" rel="noreferrer">View the ~10-mile route on Strava</a>
      </div>
    </main>
    <footer>9TH ANNUAL LE TOUR DE SOUTH HILLBILLIES</footer>
  </div>;
}
