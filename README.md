# GoatPath 2026

Mobile-first SHBAC Express status for the 9th Annual Le Tour de South Hillbillies on Friday, September 18, 2026.

## Local development

Requires Node 22 and npm 12.

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Without Firebase variables, the public page intentionally runs as an offline preview using confirmed, non-sensitive 2026 facts. GPX-derived leg distances are included; exact residential addresses are not in this repository.

## Product behavior

- Public states: pregame, at stop, en route, completed, delayed/stale, feed error, and offline preview.
- Late-joiner focus: current service state, recommended route intercept, honest arrival window, and directions when route data exists.
- Adaptive pace uses total valid completed-leg travel time divided by total valid distance after two legs.
- Admin actions use server acknowledgements, revision checks, command IDs, and Firebase Admin transactions; the browser never writes directly to Firebase.
- Unsafe snapshot undo and reset are deliberately disabled for this release.

## Security model

The participant URL is unlisted, not confidential. A high-entropy event ID prevents casual discovery, but anyone with that link can read the event record and any directions included there.

- Firebase clients read only `publicEvents/<VITE_GOATPATH_EVENT_ID>`.
- Firebase rules deny all client writes and all reads of `_private`.
- `/api/admin/login` verifies a scrypt PIN hash server-side, rate-limits by keyed IP hash, and sets a signed `HttpOnly; Secure; SameSite=Strict` cookie.
- `/api/admin/action` validates origin, content type, command schema, session, revision, transition legality, and idempotency before a Firebase Admin transaction.
- Never place PINs, session secrets, service-account JSON, or private addresses in a `VITE_*` variable.

See `FIREBASE_SETUP.md` for deployment configuration and seeding requirements.
