import { errorBody, methodNotAllowed, requireAllowedOrigin, requireJson } from '../_lib/http';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import { clearSessionCookie } from '../_lib/session';

export default function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireAllowedOrigin(req, res) || !requireJson(req, res)) return;
  clearSessionCookie(res);
  return res.status(200).json({ authenticated: false });
}

export { errorBody };
