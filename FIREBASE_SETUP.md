# Firebase and Vercel setup

GoatPath uses Firebase Realtime Database for public realtime fan-out. Browsers can read one high-entropy event path and cannot write anywhere. All mutations go through authenticated Vercel functions using the Firebase Admin SDK.

## 1. Choose the event ID

Generate a random 32+ character URL-safe value. Use the exact same value for:

- `VITE_GOATPATH_EVENT_ID` — public browser configuration
- `GOATPATH_EVENT_ID` — server-only Vercel configuration

Store the event at `publicEvents/<event-id>` using `src/types/Event.ts`. The initial record needs `revision: 0`. Populate real addresses directly in protected deployment data, never in Git; GPX-derived numeric leg distances may come from the public event fallback.

## 2. Firebase rules

Deploy and emulator-test deny-by-default rules equivalent to:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "publicEvents": {
      "$eventId": {
        ".read": "$eventId === 'REPLACE_WITH_EVENT_ID'",
        ".write": false
      }
    },
    "_private": {
      ".read": false,
      ".write": false
    }
  }
}
```

Firebase Admin bypasses these client rules. Do not use Firebase test mode.

## 3. Public Vite variables

These are intentionally embedded in browser JavaScript:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOATPATH_EVENT_ID`

Storage bucket and messaging sender ID are optional because GoatPath does not use those products.

## 4. Server-only Vercel variables

- `FIREBASE_DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — complete service-account JSON, server-only
- `GOATPATH_EVENT_ID`
- `GOATPATH_ADMIN_PIN_SCRYPT`
- `GOATPATH_SESSION_SECRET` — at least 32 random bytes
- `GOATPATH_ALLOWED_ORIGIN=https://goatpath.app`

Generate the scrypt value locally without committing the PIN:

```bash
read -rs GOATPATH_ADMIN_PIN
export GOATPATH_ADMIN_PIN
npm run hash-admin-pin
unset GOATPATH_ADMIN_PIN
```

Copy the command output into `GOATPATH_ADMIN_PIN_SCRYPT` in Vercel. The raw PIN is never stored by the application.

## 5. Event-day behavior

- Admin sessions last eight hours.
- Login attempts are limited to eight per 15 minutes using `_private/adminLoginRateLimits`.
- Arrived, Departed, message, and ETA-adjustment commands require the current `revision` and a unique command ID.
- Simultaneous admins cannot silently overwrite each other: one transaction succeeds and the stale command receives HTTP 409.
- Failed/offline commands are not queued or optimistically applied.
- Undo and reset remain disabled because whole-event snapshot restoration is unsafe with multiple admins.

## 6. Release checks

Before production:

1. Verify anonymous SDK and REST writes fail at every path.
2. Verify `_private` is unreadable from the browser.
3. Seed the exact public event path and confirm realtime updates.
4. Test correct/wrong PIN, expired/tampered cookies, wrong Origin, malformed commands, duplicate command IDs, and two-admin conflicts.
5. Confirm source, Git history, `dist`, source maps, logs, and Vercel output contain no address, raw PIN, session secret, or service-account credential.
6. Rehearse a Vercel cold start and mobile Arrived/Departed flow before event day.
