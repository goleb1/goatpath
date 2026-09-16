import type { Event, Stop } from '../types/Event';

const durationMinutes = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const value = (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
  return value >= 0 && Number.isFinite(value) ? value : null;
};

export interface ServiceReport {
  totalElapsedMinutes: number | null;
  recordedDwellMinutes: number;
  longestStop: { stop: Stop; minutes: number } | null;
  fastestLeg: { from: Stop; to: Stop; minutesPerMile: number } | null;
  biggestScheduleDelayMinutes: number | null;
}

export function createServiceReport(event: Event): ServiceReport {
  const firstArrival = event.stops.find((stop) => stop.arrivalTime)?.arrivalTime;
  const lastDeparture = [...event.stops].reverse().find((stop) => stop.departureTime)?.departureTime;
  const dwellRows = event.stops
    .map((stop) => ({ stop, minutes: durationMinutes(stop.arrivalTime, stop.departureTime) }))
    .filter((row): row is { stop: Stop; minutes: number } => row.minutes != null);
  const legs = event.stops.slice(0, -1).flatMap((from, index) => {
    const to = event.stops[index + 1];
    const minutes = durationMinutes(from.departureTime, to?.arrivalTime);
    return to && minutes != null && from.distanceToNextMiles
      ? [{ from, to, minutesPerMile: minutes / from.distanceToNextMiles }]
      : [];
  });
  const delays = event.stops.flatMap((stop) => {
    const delay = durationMinutes(stop.plannedArrival, stop.arrivalTime);
    return delay == null ? [] : [delay];
  });
  return {
    totalElapsedMinutes: durationMinutes(firstArrival, lastDeparture),
    recordedDwellMinutes: dwellRows.reduce((sum, row) => sum + row.minutes, 0),
    longestStop: dwellRows.sort((a, b) => b.minutes - a.minutes)[0] ?? null,
    fastestLeg: legs.sort((a, b) => a.minutesPerMile - b.minutesPerMile)[0] ?? null,
    biggestScheduleDelayMinutes: delays.length ? Math.max(...delays) : null,
  };
}
