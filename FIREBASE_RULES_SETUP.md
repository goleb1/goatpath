# Firebase Security Rules Setup

## The Problem
You're getting `PERMISSION_DENIED` errors when trying to write to Firebase from the admin portal. This is because your Firebase Realtime Database security rules are not properly configured for authenticated users.

## The Solution
Update your Firebase Realtime Database rules to allow authenticated users to write to the database.

---

## Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (goatpath-9e006 or similar)
3. Navigate to **Build** > **Realtime Database**
4. Click on the **Rules** tab

## Step 2: Update Security Rules

Replace your current rules with one of these configurations:

### Option A: Allow Authenticated Users Only (Recommended)
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

### Option B: Allow All Users (Development Only)
```json
{
  "rules": {
    "event": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Option C: Allow Specific Email (Most Secure)
```json
{
  "rules": {
    "event": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'jpgolebie@gmail.com'"
    }
  }
}
```

## Step 3: Publish Rules

1. Click **Publish** to save the new rules
2. Wait a few seconds for the rules to propagate

---

## What Each Rule Does

### `.read: true`
- Allows anyone to read the event data
- This is needed for the public view to work
- No authentication required

### `.write: "auth != null"`
- Only authenticated users can write
- Requires Firebase Authentication
- This is what you need for admin operations

### `.write: "auth != null && auth.token.email == 'jpgolebie@gmail.com'"`
- Only the specific admin email can write
- Most secure option
- Replace `jpgolebie@gmail.com` with your actual admin email

---

## Testing the Rules

### Test 1: Public Read Access
1. Open your app in an incognito window
2. Navigate to the main page (not admin)
3. Should load without errors
4. Check browser console - should see no permission errors

### Test 2: Admin Write Access
1. Go to `/admin` page
2. Log in with your Firebase credentials
3. Try to update a stop status
4. Should work without permission errors
5. Check browser console - should see "User authenticated" messages

### Test 3: Unauthenticated Write (Should Fail)
1. Open browser console
2. Try to write to Firebase without authentication
3. Should get permission denied (this is expected)

---

## Troubleshooting

### Still Getting Permission Denied?

1. **Check Authentication Status:**
   ```javascript
   // In browser console
   console.log('Auth user:', firebase.auth().currentUser);
   ```

2. **Verify Rules Are Published:**
   - Go to Firebase Console > Realtime Database > Rules
   - Make sure you clicked "Publish"
   - Rules should show as "Published" with timestamp

3. **Check User Email:**
   - In Firebase Console > Authentication > Users
   - Verify your admin user exists
   - Check the email matches what's in your code

4. **Test with Option B (Temporary):**
   - Use the "allow all users" rules temporarily
   - If this works, the issue is with authentication
   - If this doesn't work, the issue is with Firebase setup

### Authentication Not Working?

1. **Check Firebase Config:**
   - Verify your `.env` file has all required variables
   - Restart your dev server after changing `.env`

2. **Check Admin Email:**
   - In `AdminLogin.tsx`, verify `ADMIN_EMAIL` matches your Firebase user
   - The email in the code must exactly match the email in Firebase

3. **Check Password:**
   - Make sure you're using the password you set in Firebase
   - Not the local fallback password `2025`

---

## Security Best Practices

### For Development
- Use Option A (authenticated users only)
- This allows any authenticated user to write
- Good for testing with multiple admin accounts

### For Production
- Use Option C (specific email only)
- Replace the email with your actual admin email
- This ensures only you can make changes

### Never Use Option B in Production
- Option B allows anyone to write to your database
- This is only for testing/development

---

## Next Steps

1. ✅ Update Firebase rules (this guide)
2. ✅ Test authentication flow
3. ✅ Verify admin operations work
4. ✅ Test public view still works
5. ✅ Deploy to production with secure rules

---

## Quick Reference

**Firebase Console:** https://console.firebase.google.com/
**Rules Location:** Build > Realtime Database > Rules
**Authentication:** Build > Authentication > Users

**Current Admin Email:** `jpgolebie@gmail.com` (check `AdminLogin.tsx` line 4)
**Current Admin Password:** Set in Firebase Console > Authentication
