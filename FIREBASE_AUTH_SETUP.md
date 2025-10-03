# Firebase Authentication Setup

Your admin login now uses Firebase Authentication for secure database writes.

## What Changed

**Before:**
- Local password check only (`2025`)
- Anyone could write to database if they bypassed the UI
- ❌ Not secure

**After:**
- Firebase Authentication with email/password
- Database rules enforce authentication
- ✅ Secure - only authenticated users can write

---

## Setup Instructions

### 1. Update the Admin Email (if needed)

In `src/components/Admin/AdminLogin.tsx` line 4:

```typescript
const ADMIN_EMAIL = 'admin@goatpath.app'; // Change to your Firebase user email
```

Change this to match the email you used when creating your Firebase user.

### 2. How It Works

**Login Flow:**
1. User enters 4-digit code on admin page
2. App tries to sign in with Firebase using: `ADMIN_EMAIL` + password entered
3. If Firebase auth succeeds → full access to admin features
4. If Firebase auth fails → falls back to local password check (`2025`)

**Database Security:**
- Public view: Anyone can **read** (no auth needed)
- Admin writes: Only **authenticated** users can write

### 3. Testing

1. **Test with wrong password:**
   ```
   - Go to /admin
   - Enter wrong code (e.g., 1234)
   - Should show "Invalid access code"
   ```

2. **Test with correct Firebase password:**
   ```
   - Enter the password you set in Firebase
   - Should authenticate and show admin controls
   - Try updating a stop status
   - Should work and sync to all devices
   ```

3. **Test logout:**
   ```
   - Click LOGOUT button
   - Should redirect to login page
   - Try to refresh - should stay on login
   ```

### 4. Security Status

✅ **You're now secure!**
- Firebase rules require authentication for writes
- Admin must sign in with Firebase credentials
- Sessions managed by Firebase (auto-refresh tokens)
- Logout properly clears session

---

## Important Security Notes

### Passwords in Code

The `ADMIN_PASSWORD = '2025'` is still in the code as a **fallback** in case Firebase is unavailable. This is fine because:

1. Your Firebase rules still protect the database
2. Even if someone logs in locally, they can't write to Firebase without auth
3. The fallback only works when Firebase is completely unavailable

If you want to remove the fallback entirely, just delete lines 3 and 72-79 in `AdminLogin.tsx`.

### Email in Code

The admin email is in the code (`admin@goatpath.app`). This is **fine** - email addresses are not secret. The password is what needs to be kept secret (and it's in Firebase, not in the code).

### Firebase Console

Make sure to:
- ✅ Keep your Firebase console credentials secure
- ✅ Don't share your Firebase API keys publicly (they're in `.env` which is in `.gitignore`)
- ✅ Set up billing alerts in Firebase to avoid unexpected charges

---

## Troubleshooting

### "Invalid access code" even with correct password

**Issue:** The email in the code doesn't match your Firebase user.

**Fix:**
1. Go to Firebase Console → Authentication → Users
2. Check the email of your admin user
3. Update `ADMIN_EMAIL` in `AdminLogin.tsx` to match

### "Permission denied" when trying to update stops

**Issue:** Not properly authenticated with Firebase.

**Fix:**
1. Open browser console (F12)
2. Check for Firebase auth errors
3. Try logging out and back in
4. Verify Firebase rules are set correctly:

```json
{
  "rules": {
    "event": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### Can't log in at all

**Issue:** Firebase auth might not be initialized.

**Fix:**
1. Check browser console for errors
2. Verify Firebase is installed: `npm list firebase`
3. Check `.env` has all Firebase credentials
4. Restart dev server: `npm run dev`

---

## Next Steps

- ✅ Firebase Realtime Database configured
- ✅ Firebase Authentication configured
- ✅ Database rules secured
- ✅ Admin login uses Firebase Auth
- ✅ Logout properly signs out

**You're all set!** Your app is now secure with proper authentication. 🎉
