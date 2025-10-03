# Authentication Testing Guide

## Overview
This guide will help you test the complete authentication flow to ensure your admin portal works correctly with Firebase Authentication.

---

## Prerequisites

1. ✅ Firebase project configured
2. ✅ Environment variables set in `.env`
3. ✅ Firebase Realtime Database rules updated
4. ✅ Admin user created in Firebase Authentication

---

## Step 1: Verify Firebase Configuration

### Check Environment Variables
Make sure your `.env` file contains all required variables:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Start Development Server
```bash
npm run dev
```

---

## Step 2: Test Public View (No Authentication Required)

### Test 1: Public Page Loads
1. Open browser to `http://localhost:5173/` (or your dev URL)
2. Should load without errors
3. Check browser console - should see:
   ```
   ✅ Firebase initialized successfully - using real-time sync with auth
   ```

### Test 2: Public View Subscribes to Firebase
1. Keep the public page open
2. Check browser console for Firebase connection messages
3. Should see Firebase subscription working

---

## Step 3: Test Admin Authentication

### Test 1: Admin Login Page
1. Navigate to `http://localhost:5173/admin`
2. Should show the admin login form
3. Check browser console - should see Firebase auth initialization

### Test 2: Wrong Password (Should Fail)
1. Enter wrong password (e.g., `1234`)
2. Should show "Invalid access code"
3. Check browser console - should see Firebase auth failure

### Test 3: Correct Password (Should Succeed)
1. Enter your Firebase admin password
2. Should authenticate and show admin controls
3. Check browser console - should see:
   ```
   ✅ Authenticated with Firebase
   [Admin] User authenticated, writing to Firebase: your-email@domain.com
   ```

---

## Step 4: Test Admin Operations

### Test 1: Update Stop Status
1. In admin portal, try to update a stop status
2. Should work without permission errors
3. Check browser console - should see:
   ```
   [Admin] User authenticated, writing to Firebase: your-email@domain.com
   [Admin] Writing event update to Firebase: {...}
   ```

### Test 2: Real-time Sync
1. Open public view in another browser tab
2. Make changes in admin portal
3. Public view should update in real-time
4. No page refresh needed

### Test 3: Custom Message
1. In admin portal, set a custom message
2. Should appear in the marquee on both admin and public views
3. Check browser console for successful Firebase writes

---

## Step 5: Test Logout

### Test 1: Logout Functionality
1. Click "LOGOUT" button in admin portal
2. Should redirect to admin login page
3. Check browser console - should see:
   ```
   ✅ Signed out of Firebase
   ```

### Test 2: Session Persistence
1. After logout, try to refresh the admin page
2. Should stay on login page (not auto-login)
3. Should require re-authentication

---

## Step 6: Test Error Handling

### Test 1: Firebase Unavailable
1. Temporarily break your Firebase config (change API key)
2. Admin should fall back to localStorage
3. Check browser console - should see fallback messages

### Test 2: Network Issues
1. Disconnect internet
2. Admin operations should fail gracefully
3. Should show appropriate error messages

---

## Expected Console Output

### Successful Authentication Flow
```
✅ Firebase initialized successfully - using real-time sync with auth
✅ Authenticated with Firebase
[Admin] User authenticated, writing to Firebase: your-email@domain.com
[Admin] Writing event update to Firebase: {...}
```

### Failed Authentication Flow
```
Firebase auth failed: Firebase: Error (auth/wrong-password)
Invalid access code
```

### Fallback Flow (Firebase Unavailable)
```
⚠️ Firebase not configured - using localStorage fallback
[Admin] User not authenticated, cannot write to Firebase
[Admin] Fallback: Saved to localStorage
```

---

## Troubleshooting Common Issues

### Issue: "Permission denied" errors
**Solution:** Update Firebase Realtime Database rules (see FIREBASE_RULES_SETUP.md)

### Issue: "Invalid access code" with correct password
**Solution:** Check that `ADMIN_EMAIL` in `AdminLogin.tsx` matches your Firebase user email

### Issue: Admin loads but changes don't sync
**Solution:** Check Firebase rules allow authenticated writes

### Issue: Public view doesn't update
**Solution:** Check Firebase rules allow public reads

### Issue: Console shows "User not authenticated"
**Solution:** Verify Firebase Authentication is working and user is signed in

---

## Success Criteria

✅ **Public view loads without authentication**
✅ **Admin login works with Firebase credentials**
✅ **Admin operations write to Firebase successfully**
✅ **Changes sync in real-time between admin and public views**
✅ **Logout properly signs out and requires re-authentication**
✅ **Fallback to localStorage works when Firebase is unavailable**

---

## Next Steps After Testing

1. ✅ All tests pass → Ready for production
2. ❌ Some tests fail → Check troubleshooting section
3. 🔧 Need help → Check Firebase Console and browser console for errors

---

## Quick Debug Commands

### Check Firebase Auth Status
```javascript
// In browser console
console.log('Current user:', firebase.auth().currentUser);
```

### Check Firebase Database Connection
```javascript
// In browser console
console.log('Database:', firebase.database());
```

### Test Firebase Rules
```javascript
// In browser console (should work if authenticated)
firebase.database().ref('event').once('value').then(snapshot => {
  console.log('Data:', snapshot.val());
});
```
