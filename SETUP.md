# FW-Drama Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
bun install
```

### 2. Environment Configuration
The `.env` file is already configured with Shortical's Firebase credentials. No additional setup needed!

### 3. Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The app will start at `http://localhost:5173`

## 🔐 Authentication

The app uses **Firebase Anonymous Authentication** to access the Shortical API:

- ✅ Authentication happens automatically on app startup
- ✅ No login required - completely anonymous
- ✅ Bearer tokens are auto-generated and attached to all API requests
- ✅ Tokens refresh automatically

### How It Works

1. When the app starts, `src/main.tsx` calls `initializeAuth()`
2. Firebase signs in anonymously using `signInAnonymously()`
3. A temporary anonymous user session is created
4. An ID token is obtained and cached
5. The axios interceptor in `src/api/client.ts` automatically adds the token to all API requests:
   ```
   Authorization: Bearer {firebase_id_token}
   ```

### Troubleshooting Authentication

If you see `401 Unauthorized` errors:

1. **Check the console** for Firebase errors
2. **Verify .env file** has correct Firebase credentials
3. **Check network tab** - requests should have `Authorization: Bearer ...` header
4. **Restart dev server** to reinitialize Firebase

You should see these console logs if auth is working:
```
🔐 Firebase: Signed in anonymously
🔐 Firebase: User authenticated {uid}
```

## 📡 API Endpoints

All data comes from `https://prod.shortical.com/api/v1/`:

- **Series List**: `GET /series?pageSize=15`
- **Series Details**: `GET /series/{id}` (not yet implemented)
- **Authentication**: Bearer token (auto-attached)

## 🎯 Features

### ✅ Implemented
- Home page with infinite scroll
- Category browsing with filters
- Rankings (trending & latest)
- Search with client-side filtering
- Continue watching (Supabase)
- Firebase anonymous authentication

### ⚠️ Not Implemented
- **Watch page** - Needs Shortical streaming endpoint
- Episode playback
- Video player

## 🔧 Development

### File Structure
```
src/
├── api/
│   └── client.ts          # Axios client with Firebase auth
├── lib/
│   └── firebase.ts        # Firebase config & anonymous auth
├── hooks/
│   └── useDramas.ts       # Data fetching hooks
├── pages/
│   ├── Home.tsx          # Homepage with infinite scroll
│   ├── Category.tsx      # Category filters
│   ├── Rank.tsx          # Trending/Latest rankings
│   ├── Search.tsx        # Search with trending
│   └── Watch.tsx         # ⚠️ Not updated yet
├── types/
│   └── index.ts          # TypeScript types
└── main.tsx              # Entry point (initializes auth)
```

### Key Changes from ReelShort API

| Feature | Old (ReelShort) | New (Shortical) |
|---------|----------------|-----------------|
| Authentication | None | Firebase Anonymous Auth |
| Base URL | `https://reelshort.vercel.app` | `https://prod.shortical.com` |
| Language | `?lang=en` parameter | Not used |
| Pagination | Single page | Real pagination with `?page=N` |
| Search | API endpoint | Client-side filtering |
| Categories | Derived from themes | From `series.categories` |

## 🐛 Known Issues

1. **Watch Page Not Working**
   - The streaming endpoint is not yet implemented
   - Need to determine Shortical's video API structure

2. **Episode Count**
   - `/series` endpoint doesn't return episode count
   - Shows as 0 in listings
   - May need separate API call to `/series/{id}` for details

3. **No Real Search API**
   - Shortical doesn't have a search endpoint
   - Currently using client-side filtering
   - Limited to pre-loaded series (100 max)

## 📝 Environment Variables

```env
# API
VITE_API_URL=https://prod.shortical.com

# Firebase (Shortical Production)
VITE_FIREBASE_API_KEY=AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc
VITE_FIREBASE_AUTH_DOMAIN=shortical-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shortical-prod
VITE_FIREBASE_STORAGE_BUCKET=shortical-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=290558368283
VITE_FIREBASE_APP_ID=1:290558368283:web:abcdef123456

# Supabase (Watch Progress)
VITE_SUPABASE_URL=https://zdlokcbhtvgmuemhlmeu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_X4DFL2tTG45DFSzzgcMhcA_4DyRndRc
```

## 🚦 Testing

1. **Check Authentication**:
   - Open browser console
   - Look for "🔐 Firebase: Signed in anonymously"

2. **Test API Requests**:
   - Open Network tab
   - Look for requests to `prod.shortical.com`
   - Check `Authorization` header has Bearer token

3. **Test Features**:
   - Home page loads series
   - Infinite scroll works
   - Categories filter correctly
   - Search returns results
   - Rankings display

## 📚 Additional Resources

- [Firebase Anonymous Auth Docs](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Shortical Website](https://shortical.com/)
- [Migration Notes](./MIGRATION_NOTES.md)

## 🤝 Contributing

If you find Shortical's video streaming endpoints, please update:
1. `src/pages/Watch.tsx`
2. Add new types in `src/types/index.ts`
3. Update `MIGRATION_NOTES.md`
