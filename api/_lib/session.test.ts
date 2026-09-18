import { scryptSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hasValidSession, issueSessionCookie, validAdminSecret } from './session';
import type { ApiRequest, ApiResponse } from './http';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.GOATPATH_SESSION_SECRET = '0123456789abcdef0123456789abcdef';
  const salt = Buffer.from('0123456789abcdef');
  const hash = scryptSync('123456', salt, 32, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  process.env.GOATPATH_ADMIN_PIN_SCRYPT = `${salt.toString('base64url')}.${hash.toString('base64url')}`;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('admin sessions', () => {
  it('checks the configured scrypt PIN hash', () => {
    expect(validAdminSecret('123456')).toBe(true);
    expect(validAdminSecret('654321')).toBe(false);
    expect(validAdminSecret('short')).toBe(false);
  });

  it('issues a signed hardened cookie that validates and rejects tampering', () => {
    let cookie = '';
    const response: ApiResponse = {
      status: () => response,
      json: () => undefined,
      end: () => undefined,
      setHeader: (name, value) => { if (name === 'Set-Cookie') cookie = String(value); },
    };
    issueSessionCookie(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    const pair = cookie.split(';')[0]!;
    const request = { headers: { cookie: pair } } as ApiRequest;
    expect(hasValidSession(request)).toBe(true);
    request.headers.cookie = `${pair}x`;
    expect(hasValidSession(request)).toBe(false);
  });
});
