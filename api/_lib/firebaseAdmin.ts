import { createHash } from 'node:crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import type { Credential } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import type { ApiRequest } from './http';

const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
let credential: Credential | null = null;

function adminCredential(): Credential {
  if (credential) return credential;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  credential = serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault();
  return credential;
}

export function configuredDatabaseUrl(): string {
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!databaseURL) throw new Error('FIREBASE_DATABASE_URL is required.');
  return databaseURL.replace(/\/$/, '');
}

export async function adminAccessToken(): Promise<string> {
  const token = await adminCredential().getAccessToken();
  if (!token.access_token) throw new Error('Firebase Admin access token is unavailable.');
  return token.access_token;
}

function adminApp() {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({ credential: adminCredential(), databaseURL: configuredDatabaseUrl() });
}

export function adminDatabase() {
  return getDatabase(adminApp());
}

export function configuredEventId(): string {
  const eventId = process.env.GOATPATH_EVENT_ID;
  if (!eventId || !EVENT_ID_PATTERN.test(eventId) || eventId === 'event2026') {
    throw new Error('GOATPATH_EVENT_ID must be a high-entropy 32-128 character identifier.');
  }
  return eventId;
}

export function clientAddressKey(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  const address = first || req.socket?.remoteAddress || 'unknown';
  const pepper = process.env.GOATPATH_SESSION_SECRET ?? '';
  return createHash('sha256').update(`${pepper}:${address}`).digest('hex');
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 8;

interface RateRecord { count: number; windowStartedAt: number }

export async function consumeLoginAttempt(key: string): Promise<boolean> {
  const now = Date.now();
  let allowed = false;
  await adminDatabase().ref(`_private/adminLoginRateLimits/${key}`).transaction((raw: unknown) => {
    const current = raw as Partial<RateRecord> | null;
    if (!current || typeof current.count !== 'number' || typeof current.windowStartedAt !== 'number' || now - current.windowStartedAt >= RATE_WINDOW_MS) {
      allowed = true;
      return { count: 1, windowStartedAt: now };
    }
    if (current.count >= RATE_MAX) {
      allowed = false;
      return;
    }
    allowed = true;
    return { count: current.count + 1, windowStartedAt: current.windowStartedAt };
  }, undefined, false);
  return allowed;
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await adminDatabase().ref(`_private/adminLoginRateLimits/${key}`).remove();
}
