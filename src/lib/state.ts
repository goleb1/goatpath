import type { Event, EventPhase, EventViewState, Freshness, Stop } from '../types/Event';
import { averageDwellMinutes, effectivePace } from './eta';

export const STALE_GRACE_MS = 10 * 60 * 1000;
export const STALE_FALLBACK_MS = 45 * 60 * 1000;

function validDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function derivePhase(event: Event, now = new Date()): EventPhase {
  if (event.status === 'completed' || event.stops.every((stop) => stop.status === 'completed')) {
    return 'complete';
  }
  const activeIndex = event.stops.findIndex((stop) => stop.status === 'active');
  if (activeIndex >= 0) return 'at_stop';
  const firstPending = event.stops.findIndex((stop) => stop.status === 'pending');
  if (firstPending > 0 && event.stops[firstPending - 1]?.status === 'completed') return 'en_route';
  return now < new Date(event.plannedStartTime) ? 'pregame' : 'pregame';
}

export function deriveFreshness(
  event: Event,
  now = new Date(),
  source: Exclude<Freshness, 'stale'> = 'live',
): Freshness {
  if (source !== 'live') return source;
  const updated = validDate(event.updatedAt);
  if (!updated) return 'error';
  const phase = derivePhase(event, now);
  if (phase === 'complete') return 'live';
  if (phase === 'pregame') {
    const start = validDate(event.plannedStartTime);
    return start && now.getTime() > start.getTime() + STALE_GRACE_MS ? 'stale' : 'live';
  }
  const currentIndex = currentIndexFor(event, phase);
  let transitionDeadline: number | null = null;
  if (phase === 'at_stop') {
    const arrival = validDate(event.stops[currentIndex]?.arrivalTime);
    if (arrival) transitionDeadline = arrival.getTime() + averageDwellMinutes(event) * 60_000;
  } else {
    const previous = event.stops[currentIndex - 1];
    const departure = validDate(previous?.departureTime);
    const pace = effectivePace(event);
    if (departure && pace && previous?.distanceToNextMiles != null && previous.distanceToNextMiles > 0) {
      transitionDeadline = departure.getTime() + pace * previous.distanceToNextMiles * 60_000;
    }
  }
  const staleAt = transitionDeadline == null
    ? updated.getTime() + STALE_FALLBACK_MS
    : transitionDeadline + STALE_GRACE_MS;
  return now.getTime() > staleAt ? 'stale' : 'live';
}

function currentIndexFor(event: Event, phase: EventPhase): number {
  if (phase === 'complete') return event.stops.length - 1;
  const activeIndex = event.stops.findIndex((stop) => stop.status === 'active');
  if (activeIndex >= 0) return activeIndex;
  const pendingIndex = event.stops.findIndex((stop) => stop.status === 'pending');
  return pendingIndex >= 0 ? pendingIndex : Math.min(event.currentStopIndex, event.stops.length - 1);
}

export function deriveEventState(
  event: Event,
  now = new Date(),
  source: Exclude<Freshness, 'stale'> = 'live',
): EventViewState {
  const phase = derivePhase(event, now);
  const currentIndex = currentIndexFor(event, phase);
  const current = event.stops[currentIndex] ?? null;
  const previous = currentIndex > 0 ? event.stops[currentIndex - 1] ?? null : null;
  const next = currentIndex < event.stops.length - 1 ? event.stops[currentIndex + 1] ?? null : null;
  return {
    phase,
    freshness: deriveFreshness(event, now, source),
    currentIndex,
    previous,
    current,
    next,
    updatedAt: validDate(event.updatedAt),
  };
}

export function getGoatArtwork(stops: Stop[]): string {
  const completed = stops.filter((stop) => stop.status === 'completed').length;
  if (completed <= 2) return '/goat1.png';
  if (completed <= 5) return '/goat2.png';
  if (completed <= 7) return '/goat3.png';
  return '/goat4.png';
}
