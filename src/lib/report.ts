import type { Event, Stop } from '../types/Event';

const durationMinutes = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const value = (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
  return value >= 0 && Number.isFinite(value) ? value : null;
};

export interface ServiceReport {
  totalElapsedMinutes: number | null;
  recordedRunningMinutes: number;
  recordedStationMinutes: number;
  longestStop: { stop: Stop; minutes: number } | null;
  fastestLeg: { from: Stop; to: Stop; minutes: number; minutesPerMile: number } | null;
}

export function createServiceReport(event: Event): ServiceReport {
  const firstArrival = event.stops.find((stop) => stop.arrivalTime)?.arrivalTime;
  const lastDeparture = [...event.stops].reverse().find((stop) => stop.departureTime)?.departureTime;
  const stationRows = event.stops
    .map((stop) => ({ stop, minutes: durationMinutes(stop.arrivalTime, stop.departureTime) }))
    .filter((row): row is { stop: Stop; minutes: number } => row.minutes != null);
  const runningRows = event.stops.slice(0, -1).flatMap((from, index) => {
    const to = event.stops[index + 1];
    const minutes = durationMinutes(from.departureTime, to?.arrivalTime);
    return to && minutes != null ? [{ from, to, minutes }] : [];
  });
  const pacedLegs = runningRows.flatMap(({ from, to, minutes }) => {
    return from.distanceToNextMiles != null && from.distanceToNextMiles > 0
      ? [{ from, to, minutes, minutesPerMile: minutes / from.distanceToNextMiles }]
      : [];
  });
  return {
    totalElapsedMinutes: durationMinutes(firstArrival, lastDeparture),
    recordedRunningMinutes: runningRows.reduce((sum, leg) => sum + leg.minutes, 0),
    recordedStationMinutes: stationRows.reduce((sum, row) => sum + row.minutes, 0),
    longestStop: stationRows.sort((a, b) => b.minutes - a.minutes)[0] ?? null,
    fastestLeg: pacedLegs.sort((a, b) => a.minutesPerMile - b.minutesPerMile)[0] ?? null,
  };
}
