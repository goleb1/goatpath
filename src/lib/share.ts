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
  return `${format.format(window.start)}–${format.format(window.end)}`;
}

export function buildShareContent(
  event: Event,
  state: EventViewState,
  eta: TimeWindow | null,
  url = 'https://goatpath.app/',
): ShareContent {
  const current = state.current?.name ?? 'the route';
  let update: string;
  if (state.phase === 'at_stop') update = `SHBAC Express is at ${current}.`;
  else if (state.phase === 'en_route') update = `SHBAC Express has departed ${state.previous?.name ?? 'the last stop'} for ${current}.`;
  else if (state.phase === 'complete') update = `SHBAC Express service is complete at ${current}.`;
  else update = `SHBAC Express meets at ${current} at 5:00 p.m. Friday, September 18.`;
  const formattedEta = formatTimeWindow(eta, event.timezone);
  const text = `${update}${formattedEta && state.phase !== 'complete' ? ` Expected arrival: ${formattedEta}.` : ''}`;
  return {
    title: 'SHBAC Express service update',
    text,
    url,
    manualText: `${text} Track the herd: ${url}`,
  };
}

export function buildShareCopy(event: Event, state: EventViewState, eta: TimeWindow | null, url?: string): string {
  return buildShareContent(event, state, eta, url).manualText;
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