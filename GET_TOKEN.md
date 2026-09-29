# How to Get Your Bearer Token

Since Shortical requires Google Sign-In (anonymous auth is disabled), you need to extract the bearer token from your browser session.

## Step-by-Step Guide

### 1. Visit Shortical and Sign In
1. Go to https://shortical.com
2. Click "Sign In" or "Continue with Google"
3. Complete the Google authentication

### 2. Open Browser DevTools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`

### 3. Go to Application/Storage Tab
- **Chrome/Edge**: Click "Application" tab
- **Firefox**: Click "Storage" tab

### 4. Find Firebase Auth Data
Navigate to:
```
Application → Storage → Local Storage → https://shortical.com
```

### 5. Extract the Token

Look for a key that starts with `firebase:authUser:`

It will look something like:
```
firebase:authUser:AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc:[DEFAULT]
```

Click on it to see the value (a large JSON object).

### 6. Copy the Access Token

In the JSON value, find `stsTokenManager` → `accessToken`:

```json
{
  "uid": "...",
  "email": "your@email.com",
  "stsTokenManager": {
    "refreshToken": "...",
    "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I...",  ← COPY THIS
    "expirationTime": 1234567890000
  }
}
```

### 7. Add Token to .env File

Open `.env` and add:

```env
VITE_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6I...
```

**Important**: 
- Copy the ENTIRE token (it's very long, starting with `eyJ`)
- Don't include quotes
- Don't add spaces

### 8. Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Alternative: Use Browser Console

You can also extract the token using the browser console:

### Method 1: Quick Copy Script

Paste this into the browser console while on shortical.com:

```javascript
// Get Firebase auth data
const firebaseKey = Object.keys(localStorage).find(k => k.startsWith('firebase:authUser:'));
if (firebaseKey) {
  const authData = JSON.parse(localStorage.getItem(firebaseKey));
  const token = authData.stsTokenManager.accessToken;
  console.log('Your Bearer Token:');
  console.log(token);
  
  // Copy to clipboard
  navigator.clipboard.writeText(token).then(() => {
    console.log('✅ Token copied to clipboard!');
    console.log('Now add it to your .env file as:');
    console.log('VITE_BEARER_TOKEN=' + token.substring(0, 20) + '...');
  });
} else {
  console.error('❌ Not signed in. Please sign in to Shortical first.');
}
```

This will:
1. Find your Firebase auth data
2. Extract the access token
3. Copy it to your clipboard
4. Show instructions

Then just paste it into `.env`:
```env
VITE_BEARER_TOKEN=<paste_here>
```

### Method 2: Manual Extraction

```javascript
// 1. Get all localStorage keys
Object.keys(localStorage)

// 2. Find the Firebase auth key
const authKey = Object.keys(localStorage).find(k => k.startsWith('firebase:authUser:'))

// 3. Get the auth data
const authData = JSON.parse(localStorage.getItem(authKey))

// 4. Get the token
authData.stsTokenManager.accessToken
```

## Token Expiration

⚠️ **Important**: Bearer tokens expire after 1 hour!

When your token expires, you'll see 401 errors. To get a new token:

1. Refresh shortical.com in your browser
2. Open DevTools again
3. Copy the new `accessToken`
4. Update `.env` with the new token
5. Restart your dev server

## Troubleshooting

### "No firebase:authUser key found"
- Make sure you're signed in to shortical.com
- Try refreshing the page
- Check you're looking at the right domain (https://shortical.com, not localhost)

### "401 Unauthorized" errors
- Your token has expired (tokens last 1 hour)
- Get a new token following the steps above
- Make sure there are no extra spaces or quotes in .env

### "Token is very short or looks wrong"
- Make sure you copied `accessToken`, not `refreshToken`
- The `accessToken` should start with `eyJ`
- It should be several hundred characters long

## Example .env File

After adding the token, your `.env` should look like:

```env
# Shortical API Configuration
VITE_API_URL=https://prod.shortical.com

# Bearer Token (get from browser - expires in 1 hour)
VITE_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU4Y2EwMjZhZDIzNjViMTRkMmJjZjAzYzk4ZjVlYmZlNTY1MTgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vc2hvcnRpY2FsLXByb2QiLCJhdWQiOiJzaG9ydGljYWwtcHJvZCIsImF1dGhfdGltZSI6MTcwNjE4ODk1NCwidXNlcl9pZCI6ImFiYzEyMzQ1NiIsInN1YiI6ImFiYzEyMzQ1NiIsImlhdCI6MTcwNjE4ODk1NCwiZXhwIjoxNzA2MTkyNTU0LCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTEyMzQ1Njc4OTAiXSwiZW1haWwiOlsieW91ckBlbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.VeryLongSignatureHere

# Firebase Configuration (Shortical Production)
VITE_FIREBASE_API_KEY=AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc
VITE_FIREBASE_AUTH_DOMAIN=shortical-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shortical-prod
VITE_FIREBASE_STORAGE_BUCKET=shortical-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=290558368283
VITE_FIREBASE_APP_ID=1:290558368283:web:abcdef123456

# Supabase (optional - for watch progress)
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
```

## Security Note

⚠️ **Never commit `.env` with your real token to Git!**

The `.gitignore` file already excludes `.env`, but double-check before pushing.

Your token gives access to your Shortical account, so keep it private.
