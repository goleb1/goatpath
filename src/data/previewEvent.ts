import { event2026 } from './event2026';
import type { Event } from '../types/Event';

export type PreviewMode = 'pregame' | 'at-stop' | 'en-route' | 'delayed' | 'complete';
export const previewModes: PreviewMode[] = ['pregame', 'at-stop', 'en-route', 'delayed', 'complete'];

export function isPreviewMode(value: string | null): value is PreviewMode {
  return previewModes.includes(value as PreviewMode);
}

const iso = (time: number) => new Date(time).toISOString();

export function createPreviewEvent(mode: PreviewMode, now = new Date()): Event {
  const event = structuredClone(event2026);
  const origin = now.getTime() - (mode === 'complete' ? 300 : 150) * 60_000;
  event.initialPaceMinutesPerMile = 11.5;
  event.revision = 26;
  event.stops = event.stops.map((stop, index) => ({
    ...stop,
    address: null,
    plannedArrival: iso(origin + index * 30 * 60_000),
  }));

  const completeThrough = (lastIndex: number) => {
    for (let index = 0; index <= lastIndex; index += 1) {
      const arrival = origin + index * 30 * 60_000;
      event.stops[index]!.status = 'completed';
      event.stops[index]!.arrivalTime = iso(arrival);
      event.stops[index]!.departureTime = iso(arrival + (14 + (index % 3) * 3) * 60_000);
    }
  };

  if (mode === 'pregame') {
    event.revision = 0;
    event.updatedAt = iso(now.getTime());
    return event;
  }

  event.plannedStartTime = iso(origin);

  if (mode === 'at-stop') {
    completeThrough(3);
    event.status = 'active';
    event.currentStopIndex = 4;
    event.stops[4]!.status = 'active';
    event.stops[4]!.arrivalTime = iso(now.getTime() - 12 * 60_000);
    event.updatedAt = event.stops[4]!.arrivalTime!;
    return event;
  }

  if (mode === 'en-route' || mode === 'delayed') {
    completeThrough(4);
    event.status = 'active';
    event.currentStopIndex = 5;
    event.stops[4]!.departureTime = iso(now.getTime() - (mode === 'delayed' ? 60 : 5) * 60_000);
    event.updatedAt = event.stops[4]!.departureTime!;
    return event;
  }

  completeThrough(event.stops.length - 1);
  event.status = 'completed';
  event.currentStopIndex = event.stops.length - 1;
  event.updatedAt = event.stops.at(-1)!.departureTime!;
  return event;
}
