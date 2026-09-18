import { errorBody, methodNotAllowed } from '../_lib/http';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import { hasValidSession } from '../_lib/session';

export default function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!hasValidSession(req)) return res.status(401).json(errorBody('UNAUTHENTICATED', 'Authentication required.'));
  return res.status(200).json({ authenticated: true });
}
