import { applyCommand, parseCommand, publicEvent } from '../_lib/commands';
import type { ApplyResult } from '../_lib/commands';
import { adminDatabase, configuredEventId } from '../_lib/firebaseAdmin';
import { errorBody, methodNotAllowed, requireAllowedOrigin, requireJson } from '../_lib/http';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import { hasValidSession } from '../_lib/session';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireAllowedOrigin(req, res) || !requireJson(req, res)) return;
  if (!hasValidSession(req)) return res.status(401).json(errorBody('UNAUTHENTICATED', 'Authentication required.'));
  const command = parseCommand(req.body);
  if (!command) return res.status(400).json(errorBody('INVALID_COMMAND', 'Command does not match the required schema.'));

  try {
    const timestamp = new Date().toISOString();
    let outcome: ApplyResult | null = null;
    const reference = adminDatabase().ref(`publicEvents/${configuredEventId()}`);
    const transaction = await reference.transaction((current: unknown) => {
      outcome = applyCommand(current, command, timestamp);
      return outcome.ok ? outcome.event : undefined;
    }, undefined, false);
    if (!outcome) return res.status(503).json(errorBody('SERVICE_UNAVAILABLE', 'Event update did not complete.'));
    const resolved = outcome as ApplyResult;
    if (!resolved.ok) return res.status(409).json(errorBody(resolved.code, resolved.message));
    if (!transaction.committed && !resolved.duplicate) {
      return res.status(409).json(errorBody('TRANSACTION_CONFLICT', 'The event changed. Refresh and try again.'));
    }
    const stored = transaction.snapshot.val() as Record<string, unknown>;
    return res.status(200).json({ event: publicEvent(stored), duplicate: resolved.duplicate });
  } catch {
    return res.status(503).json(errorBody('SERVICE_UNAVAILABLE', 'Admin service is temporarily unavailable.'));
  }
}
