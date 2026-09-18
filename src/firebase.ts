import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref } from 'firebase/database';
import type { Event } from './types/Event';

const keys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GOATPATH_EVENT_ID',
] as const;

const eventId = import.meta.env.VITE_GOATPATH_EVENT_ID;
const validEventId = typeof eventId === 'string'
  && /^[A-Za-z0-9_-]{32,128}$/.test(eventId)
  && eventId !== 'event2026';

export const firebaseConfigured = keys.every((key) => Boolean(import.meta.env[key])) && validEventId;

export function subscribeToEvent(
  receive: (event: Event) => void,
  fail: (error: Error) => void,
  connection?: (connected: boolean) => void,
): () => void {
  if (!firebaseConfigured) {
    fail(new Error('Live service is not configured.'));
    return () => undefined;
  }
  const app = getApps().length ? getApp() : initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  const database = getDatabase(app);
  const unsubscribeEvent = onValue(
    ref(database, `publicEvents/${eventId}`),
    (snapshot) => {
      const value: unknown = snapshot.val();
      if (isEvent(value)) receive(value);
      else fail(new Error('Live event data is unavailable or invalid.'));
    },
    (error) => fail(error),
  );
  const unsubscribeConnection = connection
    ? onValue(ref(database, '.info/connected'), (snapshot) => connection(snapshot.val() === true))
    : () => undefined;
  return () => {
    unsubscribeEvent();
    unsubscribeConnection();
  };
}

function isEvent(value: unknown): value is Event {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Event>;
  return typeof candidate.id === 'string'
    && Array.isArray(candidate.stops)
    && typeof candidate.updatedAt === 'string'
    && typeof candidate.revision === 'number'
    && Number.isSafeInteger(candidate.revision);
}
