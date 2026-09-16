import type { Event } from '../types/Event';

const stops = [
  { id: 'baird', name: 'Baird Terminal', distanceToNextMiles: 1.146 },
  { id: 'golebie', name: 'Golebie Grand', distanceToNextMiles: 2.114 },
  { id: 'baldasare', name: 'Baldasare Union', distanceToNextMiles: 0.6 },
  { id: 'grimm', name: 'Grimm Central', distanceToNextMiles: 1.507 },
  { id: 'gormley', name: 'Gormley Junction', distanceToNextMiles: 0.695 },
  { id: 'mcgee', name: 'McGee Metro', distanceToNextMiles: 0.775 },
  { id: 'cannella', name: 'Cannella Crossing', distanceToNextMiles: 1.007 },
  { id: 'brasacchio', name: 'Brasacchio Boulevard', distanceToNextMiles: 1.852 },
  { id: 'holliday', name: 'Holliday Heights', distanceToNextMiles: 0.411 },
  { id: 'styler', name: 'Styler Station', distanceToNextMiles: null },
] as const;

/** Public event facts only. Residential addresses stay in protected deployment data. */
export const event2026: Event = {
  id: 'le-tour-2026',
  title: '9th Annual Le Tour de South Hillbillies',
  date: '2026-09-18',
  timezone: 'America/New_York',
  arrivalTime: '2026-09-18T17:00:00-04:00',
  plannedStartTime: '2026-09-18T17:30:00-04:00',
  format: 'point-to-point',
  approximateMiles: 10,
  stravaRouteUrl: 'https://www.strava.com/routes/3524095899361495860',
  defaultDwellMinutes: 20,
  initialPaceMinutesPerMile: null,
  status: 'scheduled',
  currentStopIndex: 0,
  stops: stops.map((stop, position) => ({
    ...stop,
    position,
    address: null,
    status: 'pending' as const,
  })),
  updatedAt: '2026-09-18T17:00:00-04:00',
  revision: 0,
};
