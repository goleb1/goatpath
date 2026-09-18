import { clearLoginAttempts, clientAddressKey, consumeLoginAttempt } from '../_lib/firebaseAdmin.js';
import { errorBody, methodNotAllowed, objectBody, requireAllowedOrigin, requireJson } from '../_lib/http.js';
import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { issueSessionCookie, validAdminSecret } from '../_lib/session.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireAllowedOrigin(req, res) || !requireJson(req, res)) return;
  const body = objectBody(req.body);
  if (!body || Object.keys(body).length !== 1 || !('secret' in body)) {
    return res.status(400).json(errorBody('INVALID_REQUEST', 'Invalid login request.'));
  }
  const addressKey = clientAddressKey(req);
  try {
    if (!(await consumeLoginAttempt(addressKey))) {
      return res.status(429).json(errorBody('RATE_LIMITED', 'Too many login attempts. Try again later.'));
    }
    if (!validAdminSecret(body.secret)) {
      return res.status(401).json(errorBody('INVALID_CREDENTIALS', 'Invalid credentials.'));
    }
    await clearLoginAttempts(addressKey);
    issueSessionCookie(res);
    return res.status(200).json({ authenticated: true });
  } catch {
    return res.status(503).json(errorBody('SERVICE_UNAVAILABLE', 'Admin service is not configured or temporarily unavailable.'));
  }
}
