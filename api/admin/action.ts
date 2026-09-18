import { applyCommand, parseCommand, publicEvent } from '../_lib/commands.js';
import { adminAccessToken, configuredDatabaseUrl, configuredEventId } from '../_lib/firebaseAdmin.js';
import { errorBody, methodNotAllowed, requireAllowedOrigin, requireJson } from '../_lib/http.js';
import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { hasValidSession } from '../_lib/session.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireAllowedOrigin(req, res) || !requireJson(req, res)) return;
  if (!hasValidSession(req)) return res.status(401).json(errorBody('UNAUTHENTICATED', 'Authentication required.'));
  const command = parseCommand(req.body);
  if (!command) return res.status(400).json(errorBody('INVALID_COMMAND', 'Command does not match the required schema.'));

  try {
    const timestamp = new Date().toISOString();
    const eventUrl = `${configuredDatabaseUrl()}/publicEvents/${encodeURIComponent(configuredEventId())}.json`;
    const authorization = `Bearer ${await adminAccessToken()}`;
    const currentResponse = await fetch(eventUrl, {
      headers: { Authorization: authorization, 'X-Firebase-ETag': 'true' },
    });
    if (!currentResponse.ok) throw new Error('Event read failed.');
    const etag = currentResponse.headers.get('etag');
    if (!etag) throw new Error('Firebase ETag is unavailable.');
    const outcome = applyCommand(await currentResponse.json(), command, timestamp);
    if (!outcome.ok) return res.status(409).json(errorBody(outcome.code, outcome.message));
    if (outcome.duplicate) {
      return res.status(200).json({ event: publicEvent(outcome.event), duplicate: true });
    }
    const writeResponse = await fetch(eventUrl, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        'If-Match': etag,
      },
      body: JSON.stringify(outcome.event),
    });
    if (writeResponse.status === 412) {
      return res.status(409).json(errorBody('TRANSACTION_CONFLICT', 'The event changed. Refresh and try again.'));
    }
    if (!writeResponse.ok) throw new Error('Event write failed.');
    const stored = await writeResponse.json() as Record<string, unknown>;
    return res.status(200).json({ event: publicEvent(stored), duplicate: false });
  } catch {
    return res.status(503).json(errorBody('SERVICE_UNAVAILABLE', 'Admin service is temporarily unavailable.'));
  }
}
