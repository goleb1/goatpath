import { createHash } from 'node:crypto';

export type Command =
  | { type: 'arrive'; stopIndex: number; expectedRevision: number; commandId: string }
  | { type: 'depart'; stopIndex: number; expectedRevision: number; commandId: string }
  | { type: 'message'; message: string; expectedRevision: number; commandId: string }
  | { type: 'adjust_eta'; minutes: number; expectedRevision: number; commandId: string };

interface StoredStop {
  status?: unknown;
  arrivalTime?: unknown;
  departureTime?: unknown;
}

interface CommandReceipt { signature: string; revision: number }

export interface StoredEvent {
  status?: unknown;
  currentStopIndex?: unknown;
  stops?: unknown;
  revision?: unknown;
  updatedAt?: unknown;
  customMessage?: unknown;
  etaAdjustmentMinutes?: unknown;
  _adminCommands?: Record<string, CommandReceipt>;
  [key: string]: unknown;
}

export type ApplyResult =
  | { ok: true; event: StoredEvent; duplicate: boolean }
  | { ok: false; code: 'REVISION_CONFLICT' | 'ILLEGAL_TRANSITION' | 'COMMAND_ID_REUSED'; message: string };

const exactKeys = (body: Record<string, unknown>, allowed: string[]) =>
  Object.keys(body).every((key) => allowed.includes(key)) && allowed.every((key) => key in body);
const integer = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value);

export function parseCommand(body: unknown): Command | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (!integer(value.expectedRevision) || (value.expectedRevision as number) < 0) return null;
  if (typeof value.commandId !== 'string' || !/^[A-Za-z0-9_-]{20,100}$/.test(value.commandId)) return null;
  if (value.type === 'arrive' || value.type === 'depart') {
    if (!exactKeys(value, ['type', 'stopIndex', 'expectedRevision', 'commandId'])) return null;
    if (!integer(value.stopIndex) || (value.stopIndex as number) < 0 || (value.stopIndex as number) > 100) return null;
    return value as Command;
  }
  if (value.type === 'message') {
    if (!exactKeys(value, ['type', 'message', 'expectedRevision', 'commandId'])) return null;
    if (typeof value.message !== 'string' || value.message.length > 100) return null;
    return value as Command;
  }
  if (value.type === 'adjust_eta') {
    if (!exactKeys(value, ['type', 'minutes', 'expectedRevision', 'commandId'])) return null;
    if (!integer(value.minutes) || (value.minutes as number) < -60 || (value.minutes as number) > 60) return null;
    return value as Command;
  }
  return null;
}

function signature(command: Command): string {
  return createHash('sha256').update(JSON.stringify(command)).digest('hex');
}

export function publicEvent(event: StoredEvent): StoredEvent {
  const copy = { ...event };
  delete copy._adminCommands;
  return copy;
}

export function applyCommand(raw: unknown, command: Command, serverTime: string): ApplyResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, code: 'ILLEGAL_TRANSITION', message: 'Event data is unavailable.' };
  }
  const event = structuredClone(raw) as StoredEvent;
  const receipts = event._adminCommands ?? {};
  const prior = receipts[command.commandId];
  const commandSignature = signature(command);
  if (prior) {
    if (prior.signature !== commandSignature) return { ok: false, code: 'COMMAND_ID_REUSED', message: 'Command ID was already used for another request.' };
    return { ok: true, event, duplicate: true };
  }
  const revision = integer(event.revision) ? event.revision as number : 0;
  if (revision !== command.expectedRevision) {
    return { ok: false, code: 'REVISION_CONFLICT', message: 'The event changed. Refresh and try again.' };
  }
  if (!Array.isArray(event.stops) || !integer(event.currentStopIndex)) {
    return { ok: false, code: 'ILLEGAL_TRANSITION', message: 'Event state is invalid.' };
  }
  const stops = event.stops as StoredStop[];
  if (command.type === 'arrive' || command.type === 'depart') {
    const stop = stops[command.stopIndex];
    const previous = stops[command.stopIndex - 1];
    if (!stop || command.stopIndex !== event.currentStopIndex) {
      return { ok: false, code: 'ILLEGAL_TRANSITION', message: 'That stop is not the current stop.' };
    }
    if (command.type === 'arrive') {
      const hasActiveStop = stops.some((candidate) => candidate.status === 'active');
      if (stop.status !== 'pending' || hasActiveStop || (command.stopIndex > 0 && previous?.status !== 'completed')) {
        return { ok: false, code: 'ILLEGAL_TRANSITION', message: 'Arrival is not legal from the current state.' };
      }
      stop.status = 'active';
      stop.arrivalTime = serverTime;
      event.status = 'active';
    } else {
      if (stop.status !== 'active' || typeof stop.arrivalTime !== 'string') {
        return { ok: false, code: 'ILLEGAL_TRANSITION', message: 'Departure requires an active arrived stop.' };
      }
      stop.status = 'completed';
      stop.departureTime = serverTime;
      const last = command.stopIndex === stops.length - 1;
      event.status = last ? 'completed' : 'active';
      event.currentStopIndex = last ? command.stopIndex : command.stopIndex + 1;
    }
  } else if (command.type === 'message') {
    const message = command.message.trim();
    if (message) event.customMessage = message;
    else delete event.customMessage;
  } else {
    event.etaAdjustmentMinutes = command.minutes;
  }
  event.updatedAt = serverTime;
  event.revision = revision + 1;
  receipts[command.commandId] = { signature: commandSignature, revision: revision + 1 };
  const retained = Object.entries(receipts)
    .sort(([, left], [, right]) => right.revision - left.revision)
    .slice(0, 50);
  event._adminCommands = Object.fromEntries(retained);
  return { ok: true, event, duplicate: false };
}
