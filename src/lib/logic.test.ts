import { describe, expect, it, vi } from 'vitest';
import { event2026 } from '../data/event2026';
import { applyAdminAction } from './actions';
import { arrivalWindowForStop, effectivePace, selectBestIntercept } from './eta';
import { buildShareContent, buildShareCopy, shareUpdate } from './share';
import { deriveEventState, deriveFreshness, STALE_FALLBACK_MS, STALE_GRACE_MS } from './state';
import type { Event } from '../types/Event';

const clone = (): Event => structuredClone(event2026);

describe('2026 route configuration', () => {
  it('uses the transit-style stop names and GPX-derived leg distances', () => {
    expect(event2026.stops.map((stop) => stop.name)).toEqual([
      'Baird Terminal',
      'Golebie Grand',
      'Baldasare Union',
      'Grimm Central',
      'Gormley Junction',
      'McGee Metro',
      'Cannella Crossing',
      'Brasacchio Boulevard',
      'Holliday Heights',
      'Styler Station',
    ]);
    const routeMiles = event2026.stops.reduce((sum, stop) => sum + (stop.distanceToNextMiles ?? 0), 0);
    expect(routeMiles).toBeCloseTo(10.107, 3);
    expect(event2026.stops.every((stop) => stop.address === null)).toBe(true);
  });
});

function enRouteEvent(): Event {
  const event = clone();
  event.status = 'active';
  event.currentStopIndex = 1;
  event.updatedAt = '2026-09-18T17:32:00-04:00';
  event.stops[0]!.status = 'completed';
  event.stops[0]!.arrivalTime = '2026-09-18T17:00:00-04:00';
  event.stops[0]!.departureTime = '2026-09-18T17:30:00-04:00';
  return event;
}

describe('state derivation', () => {
  it('derives pregame, at-stop, en-route, and complete phases', () => {
    expect(deriveEventState(clone(), new Date('2026-09-18T16:00:00-04:00')).phase).toBe('pregame');
    const atStop = clone();
    atStop.stops[0]!.status = 'active';
    expect(deriveEventState(atStop).phase).toBe('at_stop');
    expect(deriveEventState(enRouteEvent()).phase).toBe('en_route');
    const complete = clone();
    complete.status = 'completed';
    expect(deriveEventState(complete).phase).toBe('complete');
  });

  it('uses a conservative en-route fallback and preserves source errors', () => {
    const event = enRouteEvent();
    const stillFresh = new Date(new Date(event.updatedAt).getTime() + STALE_FALLBACK_MS - 1);
    const staleNow = new Date(new Date(event.updatedAt).getTime() + STALE_FALLBACK_MS + 1);
    expect(deriveFreshness(event, stillFresh)).toBe('live');
    expect(deriveFreshness(event, staleNow)).toBe('stale');
    expect(deriveFreshness(event, staleNow, 'error')).toBe('error');
  });

  it('marks an unstarted event delayed after the planned start grace period', () => {
    const event = clone();
    expect(deriveFreshness(event, new Date('2026-09-18T17:39:59-04:00'))).toBe('live');
    expect(deriveFreshness(event, new Date('2026-09-18T17:40:01-04:00'))).toBe('stale');
  });

  it('does not mark a normal 20-minute stop stale before its dwell deadline plus grace', () => {
    const event = clone();
    event.status = 'active';
    event.updatedAt = '2026-09-18T17:00:00-04:00';
    event.stops[0]!.status = 'active';
    event.stops[0]!.arrivalTime = event.updatedAt;
    expect(deriveFreshness(event, new Date('2026-09-18T17:29:59-04:00'))).toBe('live');
    expect(deriveFreshness(event, new Date(new Date(event.updatedAt).getTime() + event.defaultDwellMinutes * 60_000 + STALE_GRACE_MS + 1))).toBe('stale');
  });
});

describe('ETA and intercept calculations', () => {
  it('returns no fabricated ETA when pace or distance is missing', () => {
    const event = enRouteEvent();
    expect(effectivePace(event)).toBeNull();
    expect(arrivalWindowForStop(event, 1)).toBeNull();
  });

  it('uses distance-weighted live pace after two completed legs and creates a window', () => {
    const event = clone();
    event.initialPaceMinutesPerMile = 12;
    event.stops[0]!.distanceToNextMiles = 1;
    event.stops[1]!.distanceToNextMiles = 3;
    event.stops[0]!.departureTime = '2026-09-18T17:00:00-04:00';
    event.stops[1]!.arrivalTime = '2026-09-18T17:10:00-04:00';
    event.stops[1]!.departureTime = '2026-09-18T17:20:00-04:00';
    event.stops[2]!.arrivalTime = '2026-09-18T18:05:00-04:00';
    event.stops[2]!.departureTime = '2026-09-18T17:50:00-04:00';
    event.stops[2]!.distanceToNextMiles = 1;
    expect(effectivePace(event)).toBe(13.75);
    const window = arrivalWindowForStop(event, 3);
    expect(window).not.toBeNull();
    if (!window) throw new Error('Expected an ETA window');
    expect(window.end.getTime() - window.start.getTime()).toBe(10 * 60_000);
  });

  it('sends a late joiner ahead when current-stop departure is imminent', () => {
    const event = clone();
    event.status = 'active';
    event.stops[0]!.status = 'active';
    event.stops[0]!.arrivalTime = '2026-09-18T17:00:00-04:00';
    const now = new Date('2026-09-18T17:15:00-04:00');
    const state = deriveEventState(event, now);
    expect(selectBestIntercept(event, state, now).stop?.name).toBe('Golebie Grand');
  });
});

describe('sharing', () => {
  it('builds state-specific en-route copy without an ETA promise', () => {
    const event = enRouteEvent();
    const state = deriveEventState(event, new Date('2026-09-18T17:35:00-04:00'));
    expect(buildShareCopy(event, state, null)).toBe('SHBAC Express has departed Baird Terminal for Golebie Grand. Track the herd: https://goatpath.app/');
  });

  it('uses separate native-share fields and falls back to complete clipboard text', async () => {
    const event = enRouteEvent();
    const state = deriveEventState(event, new Date('2026-09-18T17:35:00-04:00'));
    const content = buildShareContent(event, state, null);
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareUpdate(content, { share, clipboard: undefined })).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: content.title, text: content.text, url: content.url });
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareUpdate(content, { share: undefined, clipboard: { writeText } })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(content.manualText);
  });

  it('treats an aborted share sheet as cancellation instead of copying', async () => {
    const event = enRouteEvent();
    const state = deriveEventState(event, new Date('2026-09-18T17:35:00-04:00'));
    const content = buildShareContent(event, state, null);
    const writeText = vi.fn();
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    expect(await shareUpdate(content, { share, clipboard: { writeText } })).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('admin state transitions', () => {
  it('applies arrived and departed timestamps without credentials in event data', () => {
    const arrived = applyAdminAction(clone(), { type: 'arrive', stopIndex: 0, at: '2026-09-18T17:00:00-04:00' });
    expect(arrived.stops[0]!.status).toBe('active');
    const departed = applyAdminAction(arrived, { type: 'depart', stopIndex: 0, at: '2026-09-18T17:20:00-04:00' });
    expect(departed.stops[0]!.status).toBe('completed');
    expect(departed.currentStopIndex).toBe(1);
    expect(departed).not.toHaveProperty('adminPassword');
  });
});
