import type { Event } from '../types/Event';

export type AdminAction =
  | { type: 'arrive'; stopIndex: number; at: string }
  | { type: 'depart'; stopIndex: number; at: string }
  | { type: 'message'; message: string; at: string }
  | { type: 'adjust_eta'; minutes: number; at: string };

export function applyAdminAction(event: Event, action: AdminAction): Event {
  const stops = event.stops.map((stop) => ({ ...stop }));
  if (action.type === 'message') {
    return { ...event, customMessage: action.message.trim().slice(0, 100) || undefined, updatedAt: action.at };
  }
  if (action.type === 'adjust_eta') {
    return { ...event, etaAdjustmentMinutes: Math.max(-60, Math.min(60, action.minutes)), updatedAt: action.at };
  }
  const stop = stops[action.stopIndex];
  if (!stop) return event;
  if (action.type === 'arrive') {
    stop.status = 'active';
    stop.arrivalTime = action.at;
    return { ...event, status: 'active', currentStopIndex: action.stopIndex, stops, updatedAt: action.at };
  }
  stop.status = 'completed';
  stop.departureTime = action.at;
  const isLast = action.stopIndex === stops.length - 1;
  return {
    ...event,
    status: isLast ? 'completed' : 'active',
    currentStopIndex: isLast ? action.stopIndex : action.stopIndex + 1,
    stops,
    updatedAt: action.at,
  };
}
