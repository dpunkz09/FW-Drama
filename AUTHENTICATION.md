# Firebase Anonymous Authentication Guide

## Overview

This app uses **Firebase Anonymous Authentication** to authenticate with the Shortical API. This is the same method used by the official Shortical website.

## Why Anonymous Auth?

1. **No Login Required**: Users can access content without creating an account
2. **Automatic**: Authentication happens in the background
3. **Secure**: Uses official Firebase SDK and generates valid Bearer tokens
4. **Same as Official**: Mimics how shortical.com authenticates

## How It Works

### 1. App Initialization (`src/main.tsx`)
```typescript
import { initializeAuth } from './lib/firebase'

// Initialize Firebase authentication before rendering
initializeAuth().then(() => {
  // App renders after auth completes
  ReactDOM.createRoot(document.getElementById('root')!).render(...)
})
```

### 2. Firebase Anonymous Sign-In (`src/lib/firebase.ts`)
```typescript
import { signInAnonymously } from 'firebase/auth';

export const initializeAuth = async () => {
  await signInAnonymously(auth);
  console.log('🔐 Firebase: Signed in anonymously');
}
```

### 3. Token Injection (`src/api/client.ts`)
```typescript
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. App Starts                                               │
│    └─> src/main.tsx calls initializeAuth()                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Firebase Anonymous Sign-In                               │
│    └─> signInAnonymously(auth)                             │
│    └─> Creates temporary anonymous user                    │
│    └─> Generates Firebase ID token                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User Authenticated                                       │
│    └─> auth.currentUser is set                             │
│    └─> Console: "🔐 Firebase: User authenticated {uid}"    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API Requests                                             │
│    └─> Interceptor gets current user                       │
│    └─> Calls user.getIdToken()                             │
│    └─> Adds: Authorization: Bearer {token}                 │
│    └─> Request sent to prod.shortical.com                  │
└─────────────────────────────────────────────────────────────┘
```

## Console Output

### Successful Authentication
```
🔐 Firebase: Signed in anonymously
🔐 Firebase: User authenticated abc123def456
📤 API Request #1: GET /api/v1/series?pageSize=15 [Authenticated]
✅ API Response: /api/v1/series?pageSize=15 [200] - 15 items
```

### Failed Authentication
```
🔐 Firebase: Anonymous sign-in failed: [error details]
⚠️ API Request #1: GET /api/v1/series?pageSize=15 [No Auth]
🔒 Unauthorized: Firebase token may be invalid or expired
❌ API Error: /api/v1/series?pageSize=15 [401]
```

## Debugging Authentication Issues

### Issue: 401 Unauthorized Errors

**Symptoms**:
- API requests return 401
- Console shows "🔒 Unauthorized"
- No data loads

**Solutions**:

1. **Check Firebase Initialization**:
   ```
   Look for: "🔐 Firebase: Signed in anonymously"
   If missing: Firebase auth failed to initialize
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check .env file has correct values
   VITE_FIREBASE_API_KEY=AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc
   VITE_FIREBASE_AUTH_DOMAIN=shortical-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=shortical-prod
   ```

3. **Check Network Tab**:
   - Open DevTools > Network
   - Look for requests to `prod.shortical.com`
   - Check Headers section
   - Should see: `Authorization: Bearer eyJ...`

4. **Restart Dev Server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Clear cache and restart
   npm run dev
   ```

### Issue: No Firebase Logs in Console

**Symptoms**:
- No "🔐 Firebase" logs appear
- App seems stuck or frozen

**Solutions**:

1. **Check Browser Console for Errors**:
   - Look for red error messages
   - Firebase might be blocked by browser

2. **Verify Firebase Config**:
   ```typescript
   // Check src/lib/firebase.ts
   // Make sure all env variables are loaded
   console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
   ```

3. **Check Network Connection**:
   - Firebase needs internet to authenticate
   - Check if firewall is blocking Firebase

### Issue: Token Expired

**Symptoms**:
- Works initially, then stops
- 401 errors after some time

**Solutions**:
- **Automatic Refresh**: Firebase tokens auto-refresh
- If still failing, reload the page
- Anonymous sessions last indefinitely unless cleared

## Token Lifecycle

1. **Creation**: When `signInAnonymously()` completes
2. **Expiration**: 1 hour (Firebase default)
3. **Refresh**: Automatic via Firebase SDK
4. **Invalidation**: Only on sign-out or session clear

## Security Notes

### Is Anonymous Auth Secure?

✅ **Yes, for this use case**:
- Uses official Firebase SDK
- Tokens are properly signed by Firebase
- Same method as official Shortical website
- No sensitive data exposed

❌ **Not suitable for**:
- User-specific data storage
- Payment processing
- Account management

### Can Tokens Be Stolen?

- Tokens are valid for 1 hour
- Can be intercepted like any HTTP request
- Not a concern for public content API
- Shortical's API is public-facing

### Anonymous User Persistence

- Anonymous users persist in browser storage
- Cleared on: browser cache clear, incognito close
- New anonymous user created on next visit

## Manual Testing

### Test Authentication
```javascript
// Open browser console
import { auth } from './src/lib/firebase';

// Check current user
console.log('Current user:', auth.currentUser);

// Get token
auth.currentUser?.getIdToken().then(token => {
  console.log('Token:', token.substring(0, 50) + '...');
});
```

### Test API Request
```javascript
// Manual API test in console
fetch('https://prod.shortical.com/api/v1/series?pageSize=5', {
  headers: {
    'Authorization': 'Bearer ' + await auth.currentUser.getIdToken()
  }
})
.then(r => r.json())
.then(data => console.log('Series:', data));
```

## Firebase Configuration

The app uses Shortical's production Firebase project:

| Config | Value |
|--------|-------|
| API Key | `AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc` |
| Auth Domain | `shortical-prod.firebaseapp.com` |
| Project ID | `shortical-prod` |
| Storage Bucket | `shortical-prod.appspot.com` |

These values are **public** and safe to include in client-side code (they're visible in the official Shortical website).

## Alternative Authentication Methods

If anonymous auth doesn't work, other options include:

1. **Email/Password Auth** (requires account creation)
2. **Custom Token Auth** (requires backend)
3. **API Key** (if Shortical provides one)
4. **Session Cookies** (like browser does)

However, **anonymous auth is recommended** as it matches the official implementation.
