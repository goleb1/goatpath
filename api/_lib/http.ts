export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(): void;
  setHeader(name: string, value: string | string[]): void;
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

export function methodNotAllowed(res: ApiResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json(errorBody('METHOD_NOT_ALLOWED', 'Method not allowed.'));
}

export function requireJson(req: ApiRequest, res: ApiResponse): boolean {
  const value = req.headers['content-type'];
  const contentType = Array.isArray(value) ? value[0] : value;
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    res.status(415).json(errorBody('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.'));
    return false;
  }
  return true;
}

export function requireAllowedOrigin(req: ApiRequest, res: ApiResponse): boolean {
  const allowed = process.env.GOATPATH_ALLOWED_ORIGIN;
  const value = req.headers.origin;
  const origin = Array.isArray(value) ? value[0] : value;
  if (!allowed || origin !== allowed) {
    res.status(403).json(errorBody('FORBIDDEN_ORIGIN', 'Request origin is not allowed.'));
    return false;
  }
  return true;
}

export function objectBody(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}
