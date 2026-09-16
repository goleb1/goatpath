import { arrivalWindowForStop, averageDwellMinutes } from './eta';
import type { Event, EventViewState, TimeWindow } from '../types/Event';

export interface ShareContent {
  title: string;
  text: string;
  url: string;
  manualText: string;
}

export function formatTimeWindow(window: TimeWindow | null, timezone: string): string | null {
  if (!window) return null;
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  });
  if (window.start.getTime() === window.end.getTime()) return format.format(window.start);
  const start = format.format(window.start);
  const end = format.format(window.end);
  const startPeriod = start.match(/\s([AP]M)$/)?.[1];
  const endPeriod = end.match(/\s([AP]M)$/)?.[1];
  return startPeriod && startPeriod === endPeriod
    ? `${start.replace(/\s[AP]M$/, '')}–${end}`
    : `${start}–${end}`;
}

function expectedDeparture(event: Event, state: EventViewState): TimeWindow | null {
  if (state.phase !== 'at_stop' || !state.current?.arrivalTime) return null;
  const departure = new Date(
    new Date(state.current.arrivalTime).getTime() + averageDwellMinutes(event) * 60_000,
  );
  return { start: departure, end: departure };
}

export function buildShareContent(
  event: Event,
  state: EventViewState,
  now = new Date(),
  url = 'https://goatpath.app/',
): ShareContent {
  const current = state.current?.name ?? 'the route';
  let update: string;

  if (state.phase === 'at_stop') {
    update = `SHBAC Express has arrived at ${current}.`;
    const departure = formatTimeWindow(expectedDeparture(event, state), event.timezone);
    if (departure) update += ` Expected departure: ${departure}.`;
  } else if (state.phase === 'en_route') {
    update = `SHBAC Express has departed ${state.previous?.name ?? 'the last stop'} for ${current}.`;
    const arrival = formatTimeWindow(arrivalWindowForStop(event, state.currentIndex, now), event.timezone);
    if (arrival) update += ` Expected arrival: ${arrival}.`;
  } else if (state.phase === 'complete') {
    update = `SHBAC Express service is complete at ${current}.`;
  } else {
    update = `SHBAC Express meets at ${current} at 5:00 p.m. Friday, September 18.`;
  }

  return {
    title: 'SHBAC Express service update',
    text: update,
    url,
    manualText: `${update} Track the herd: ${url}`,
  };
}

export function buildShareCopy(
  event: Event,
  state: EventViewState,
  now = new Date(),
  url?: string,
): string {
  return buildShareContent(event, state, now, url).manualText;
}

interface ShareNavigator {
  share?: (data?: ShareData) => Promise<void>;
  clipboard?: Pick<Clipboard, 'writeText'>;
}

export async function shareUpdate(
  content: ShareContent,
  nav: ShareNavigator = navigator,
): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: content.title, text: content.text, url: content.url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      if (!nav.clipboard?.writeText) throw error;
    }
  }
  if (!nav.clipboard?.writeText) throw new Error('Sharing is not supported in this browser.');
  await nav.clipboard.writeText(content.manualText);
  return 'copied';
}
