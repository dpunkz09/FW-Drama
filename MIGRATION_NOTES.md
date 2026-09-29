# Shortical API Migration Notes

## Completed Changes

### 1. TypeScript Types ✅
- Added Shortical-specific types: `Series`, `SeriesListItem`, `SeriesDetailResponse`, `UILabel`, `ComingSoonData`
- Created `seriesToDrama()` transformation function for backward compatibility
- Maintained `Drama` interface for existing components

### 2. Environment & Configuration ✅
- Updated `.env.example` with Shortical API configuration
- Added Firebase authentication requirements (required for Bearer tokens)
- Documented new API endpoints structure

### 3. API Client ✅
- Created `src/lib/firebase.ts` for Firebase authentication
- Updated `src/api/client.ts` to use Shortical base URL (`https://prod.shortical.com`)
- Added axios interceptor to automatically attach Firebase Bearer token to requests

### 4. Data Hooks ✅
- Refactored all hooks in `src/hooks/useDramas.ts`:
  - `useDramas()` - Fetches first 15 series for featured section
  - `useInfiniteDramas()` - Implemented real pagination with loadMore
  - `useRankDramas()` - Fetches and sorts by views
  - `useSearchDramas()` - Client-side filtering (Shortical has no search endpoint)

### 5. Pages Updated ✅
- `Home.tsx` - Added infinite scroll with proper pagination
- `Category.tsx` - Fetches categories from series data
- `Rank.tsx` - Uses `useRankDramas()` hook with client-side sorting
- `Search.tsx` - Uses `useSearchDramas()` hook with trending fallback

## Known Limitations & TODO

### Video Streaming ✅ IMPLEMENTED
The Watch page now uses Shortical's CloudFront CDN for video streaming:
- **Endpoint**: `https://dirjqbe1kaah2.cloudfront.net/{drama_id}/{episode}/video.m3u8`
- **Format**: HLS (HTTP Live Streaming)
- **Player**: HLS.js for browsers, native for Safari
- **Features**: Episode navigation, swipe gestures, progress tracking

**Note**: Episode numbers are 1-indexed in the URL (episode 1 = `/1/video.m3u8`)

### Firebase Authentication Setup
The app uses **Firebase Anonymous Authentication** to obtain Bearer tokens:

1. **On app startup** (`main.tsx`), Firebase automatically signs in anonymously
2. **Authentication flow**:
   - `initializeAuth()` calls `signInAnonymously()`
   - Firebase generates an anonymous user session
   - User gets a valid Firebase ID token
   - Token is automatically refreshed by Firebase
3. **API requests**: The axios interceptor automatically attaches the Bearer token to all requests

**Configuration** (already set in `.env`):
```env
VITE_FIREBASE_API_KEY=AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc
VITE_FIREBASE_AUTH_DOMAIN=shortical-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shortical-prod
VITE_FIREBASE_STORAGE_BUCKET=shortical-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=290558368283
VITE_FIREBASE_APP_ID=1:290558368283:web:abcdef123456
```

These are Shortical's public Firebase credentials extracted from their website.

**Note**: Anonymous authentication creates a temporary user session that mimics how the official Shortical website authenticates with their API.

### Language Support
- Removed language switching (Shortical API doesn't use lang parameter)
- The `useLanguage()` store is no longer used by data hooks
- Consider removing the language switcher UI or repurposing it

### Episode Count
Shortical's `/api/v1/series` endpoint doesn't return episode count in the list view.
- Fetches actual episode count from `/api/v1/series/{id}/episodes`
- Episode list now shows only available episodes
- Fallback to 100 episodes if API call fails

## Testing Checklist

- [ ] Configure Firebase authentication
- [ ] Test Home page with infinite scroll
- [ ] Test Category filtering
- [ ] Test Rank page sorting
- [ ] Test Search functionality
- [ ] Test Continue Watching (uses Supabase, should still work)
- [ ] **Investigate and fix Watch page streaming** ⚠️
- [ ] Verify Firebase Bearer token is being attached to requests
- [ ] Test error handling for 401/403 responses

## API Endpoint Mapping

| Feature | Old ReelShort Endpoint | New Shortical Endpoint |
|---------|----------------------|----------------------|
| List Series | `/api/foryou?lang={lang}` | `/api/v1/series?pageSize=15` |
| Latest | `/api/latest?lang={lang}` | `/api/v1/series?pageSize=15&page=N` |
| Trending | `/api/trending?lang={lang}` | `/api/v1/series?pageSize=50` (sorted by views) |
| Search | `/search?keyword={q}&lang={lang}` | Client-side filtering |
| Details | `/api/details?book_id={id}` | `/api/v1/series/{id}` |
| Episodes | N/A | `/api/v1/series/{id}/episodes` |
| Streaming | `/api/stream/all-episode?bookId={id}` | `https://dirjqbe1kaah2.cloudfront.net/{id}/{ep}/video.m3u8` |

## Notes
- Shortical uses numeric IDs instead of string book_ids
- Bearer token authentication is required for all endpoints
- No language parameter - content appears to be in a single language
- Categories come from `series.categories` array in the API response
