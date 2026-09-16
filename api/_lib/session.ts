import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './http';

const COOKIE_NAME = '__Host-goatpath_admin';
const SESSION_SECONDS = 8 * 60 * 60;

type SessionPayload = { exp: number; nonce: string; v: 1 };

function sessionSecret(): string {
  const secret = process.env.GOATPATH_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('GOATPATH_SESSION_SECRET must contain at least 32 bytes.');
  return secret;
}

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

export function issueSessionCookie(res: ApiResponse): void {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    nonce: randomBytes(16).toString('base64url'),
    v: 1,
  };
  const encoded = encode(JSON.stringify(payload));
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encoded}.${sign(encoded)}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`);
}

export function clearSessionCookie(res: ApiResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
}

function cookieValue(req: ApiRequest): string | null {
  const rawHeader = req.headers.cookie;
  const raw = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!raw) return null;
  for (const item of raw.split(';')) {
    const [name, ...parts] = item.trim().split('=');
    if (name === COOKIE_NAME) return parts.join('=');
  }
  return null;
}

export function hasValidSession(req: ApiRequest): boolean {
  try {
    const token = cookieValue(req);
    if (!token) return false;
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra) return false;
    const expected = sign(encoded);
    const suppliedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<SessionPayload>;
    return payload.v === 1 && typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function validAdminSecret(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length < 6 || candidate.length > 128) return false;
  const configured = process.env.GOATPATH_ADMIN_PIN_SCRYPT;
  const [saltValue, hashValue, extra] = configured?.split('.') ?? [];
  if (!saltValue || !hashValue || extra) throw new Error('GOATPATH_ADMIN_PIN_SCRYPT is required.');
  const salt = Buffer.from(saltValue, 'base64url');
  const expected = Buffer.from(hashValue, 'base64url');
  if (salt.length !== 16 || expected.length !== 32) throw new Error('GOATPATH_ADMIN_PIN_SCRYPT is invalid.');
  const actual = scryptSync(candidate, salt, expected.length, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
