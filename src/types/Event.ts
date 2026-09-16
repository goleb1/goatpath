export type StopStatus = 'pending' | 'active' | 'completed';

export interface Stop {
  id: string;
  name: string;
  position: number;
  address: string | null;
  distanceToNextMiles: number | null;
  status: StopStatus;
  plannedArrival?: string;
  arrivalTime?: string;
  departureTime?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  timezone: string;
  arrivalTime: string;
  plannedStartTime: string;
  format: 'point-to-point';
  approximateMiles: number;
  stravaRouteUrl: string;
  defaultDwellMinutes: number;
  initialPaceMinutesPerMile: number | null;
  status: 'scheduled' | 'active' | 'completed';
  currentStopIndex: number;
  stops: Stop[];
  updatedAt: string;
  revision: number;
  customMessage?: string;
  etaAdjustmentMinutes?: number;
}

export type EventPhase = 'pregame' | 'at_stop' | 'en_route' | 'complete';
export type Freshness = 'live' | 'stale' | 'offline' | 'error';

export interface EventViewState {
  phase: EventPhase;
  freshness: Freshness;
  currentIndex: number;
  previous: Stop | null;
  current: Stop | null;
  next: Stop | null;
  updatedAt: Date | null;
}

export interface TimeWindow {
  start: Date;
  end: Date;
}
