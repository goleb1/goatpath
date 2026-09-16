import type { Event, EventViewState, Stop, TimeWindow } from '../types/Event';

const MIN_COMPLETED_LEGS_FOR_LIVE_PACE = 2;
const MIN_PLAUSIBLE_PACE_MINUTES_PER_MILE = 3;
const MAX_PLAUSIBLE_PACE_MINUTES_PER_MILE = 60;
const WINDOW_MINUTES = 5;
const INTERCEPT_BUFFER_MINUTES = 10;

const minutesBetween = (later: string, earlier: string) =>
  (new Date(later).getTime() - new Date(earlier).getTime()) / 60_000;

export function averageDwellMinutes(event: Event): number {
  const dwells = event.stops
    .filter((stop) => stop.arrivalTime && stop.departureTime)
    .map((stop) => minutesBetween(stop.departureTime!, stop.arrivalTime!))
    .filter((minutes) => minutes >= 0 && Number.isFinite(minutes));
  if (!dwells.length) return event.defaultDwellMinutes;
  const actual = dwells.reduce((sum, minutes) => sum + minutes, 0) / dwells.length;
  return (actual + event.defaultDwellMinutes) / 2;
}

export function effectivePace(event: Event): number | null {
  let totalMinutes = 0;
  let totalMiles = 0;
  let validLegs = 0;
  for (let index = 0; index < event.stops.length - 1; index += 1) {
    const from = event.stops[index];
    const to = event.stops[index + 1];
    if (from?.departureTime && to?.arrivalTime && from.distanceToNextMiles != null && from.distanceToNextMiles > 0) {
      const duration = minutesBetween(to.arrivalTime, from.departureTime);
      const pace = duration / from.distanceToNextMiles;
      if (
        Number.isFinite(duration)
        && Number.isFinite(pace)
        && pace >= MIN_PLAUSIBLE_PACE_MINUTES_PER_MILE
        && pace <= MAX_PLAUSIBLE_PACE_MINUTES_PER_MILE
      ) {
        totalMinutes += duration;
        totalMiles += from.distanceToNextMiles;
        validLegs += 1;
      }
    }
  }
  if (validLegs >= MIN_COMPLETED_LEGS_FOR_LIVE_PACE && totalMiles > 0) {
    return totalMinutes / totalMiles;
  }
  return event.initialPaceMinutesPerMile;
}

export function arrivalWindowForStop(event: Event, stopIndex: number, now = new Date()): TimeWindow | null {
  const stop = event.stops[stopIndex];
  if (!stop) return null;
  if (stop.arrivalTime) {
    const arrival = new Date(stop.arrivalTime);
    return { start: arrival, end: arrival };
  }
  const pace = effectivePace(event);
  if (!pace) return null;

  let cursor: Date;
  let index: number;
  const prior = event.stops[stopIndex - 1];
  if (prior?.departureTime) {
    cursor = new Date(prior.departureTime);
    index = stopIndex - 1;
  } else {
    cursor = now > new Date(event.plannedStartTime) ? now : new Date(event.plannedStartTime);
    index = Math.max(0, event.stops.findIndex((candidate) => candidate.status === 'pending') - 1);
  }

  for (; index < stopIndex; index += 1) {
    const leg = event.stops[index];
    if (!leg || leg.distanceToNextMiles == null) return null;
    cursor = new Date(cursor.getTime() + leg.distanceToNextMiles * pace * 60_000);
    if (index + 1 < stopIndex) cursor = new Date(cursor.getTime() + averageDwellMinutes(event) * 60_000);
  }
  const adjustment = event.etaAdjustmentMinutes ?? 0;
  const center = new Date(cursor.getTime() + adjustment * 60_000);
  return {
    start: new Date(center.getTime() - WINDOW_MINUTES * 60_000),
    end: new Date(center.getTime() + WINDOW_MINUTES * 60_000),
  };
}

export interface InterceptRecommendation {
  stop: Stop | null;
  stopIndex: number;
  arrivalWindow: TimeWindow | null;
  reason: string;
}

export function selectBestIntercept(
  event: Event,
  state: EventViewState,
  now = new Date(),
): InterceptRecommendation {
  let stopIndex = state.currentIndex;
  let reason = state.phase === 'pregame' ? 'Meet the herd at the starting stop.' : 'Head to the current destination.';

  if (state.phase === 'at_stop' && state.current?.arrivalTime && state.next) {
    const expectedDeparture = new Date(
      new Date(state.current.arrivalTime).getTime() + averageDwellMinutes(event) * 60_000,
    );
    if (expectedDeparture.getTime() - now.getTime() <= INTERCEPT_BUFFER_MINUTES * 60_000) {
      stopIndex += 1;
      reason = 'Departure is close; get ahead to the next stop.';
    } else {
      reason = 'There is still time to catch the herd here.';
    }
  } else if (state.phase === 'complete') {
    reason = 'Service has ended at the final stop.';
  }

  return {
    stop: event.stops[stopIndex] ?? null,
    stopIndex,
    arrivalWindow: arrivalWindowForStop(event, stopIndex, now),
    reason,
  };
}
