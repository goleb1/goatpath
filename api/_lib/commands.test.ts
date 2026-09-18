import { describe, expect, it } from 'vitest';
import { event2026 } from '../../src/data/event2026';
import { applyCommand, parseCommand, publicEvent } from './commands';

const commandId = 'command_1234567890abcdef';

describe('admin command boundary', () => {
  it('rejects malformed and extra command fields', () => {
    expect(parseCommand({ type: 'arrive', stopIndex: 0, expectedRevision: 0, commandId, extra: true })).toBeNull();
    expect(parseCommand({ type: 'adjust_eta', minutes: 61, expectedRevision: 0, commandId })).toBeNull();
  });

  it('applies a legal transition using server time and increments revision', () => {
    const result = applyCommand(event2026, { type: 'arrive', stopIndex: 0, expectedRevision: 0, commandId }, '2026-09-18T21:01:00.000Z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.revision).toBe(1);
    expect((result.event.stops as Array<Record<string, unknown>>)[0]?.arrivalTime).toBe('2026-09-18T21:01:00.000Z');
    expect(result.event.updatedAt).toBe('2026-09-18T21:01:00.000Z');
  });

  it('rejects stale revisions and illegal departures', () => {
    expect(applyCommand(event2026, { type: 'arrive', stopIndex: 0, expectedRevision: 9, commandId }, new Date().toISOString())).toMatchObject({ ok: false, code: 'REVISION_CONFLICT' });
    expect(applyCommand(event2026, { type: 'depart', stopIndex: 0, expectedRevision: 0, commandId }, new Date().toISOString())).toMatchObject({ ok: false, code: 'ILLEGAL_TRANSITION' });
  });

  it('makes exact command retries idempotent and blocks command ID reuse', () => {
    const command = { type: 'arrive' as const, stopIndex: 0, expectedRevision: 0, commandId };
    const first = applyCommand(event2026, command, '2026-09-18T21:01:00.000Z');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const duplicate = applyCommand(first.event, command, '2026-09-18T21:02:00.000Z');
    expect(duplicate).toMatchObject({ ok: true, duplicate: true });
    const reused = applyCommand(first.event, { ...command, type: 'depart' }, '2026-09-18T21:02:00.000Z');
    expect(reused).toMatchObject({ ok: false, code: 'COMMAND_ID_REUSED' });
    expect(publicEvent(first.event)).not.toHaveProperty('_adminCommands');
  });
});
