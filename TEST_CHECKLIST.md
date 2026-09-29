# Testing Checklist

Use this checklist to verify the Shortical API integration is working correctly.

## ✅ Pre-Flight Checks

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists with Firebase config
- [ ] Dev server can start without errors

## 🔐 Authentication Testing

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Open Browser Console
- Press `F12` or `Ctrl+Shift+I`
- Go to Console tab

### 3. Check for Authentication Logs

**Expected Output**:
```
🔐 Firebase: Signed in anonymously
🔐 Firebase: User authenticated abc123xyz789
```

✅ **PASS**: Both logs appear
❌ **FAIL**: No logs or error messages

### 4. Check Network Tab for API Requests

- Go to Network tab in DevTools
- Filter by `XHR` or `Fetch`
- Look for requests to `prod.shortical.com`

**Check the Authorization Header**:
1. Click on a request to `prod.shortical.com/api/v1/series`
2. Go to "Headers" section
3. Look for: `Authorization: Bearer eyJ...`

✅ **PASS**: Authorization header present with Bearer token
❌ **FAIL**: No Authorization header or 401 response

## 🏠 Home Page Testing

- [ ] Home page loads without errors
- [ ] Featured drama displays at top
- [ ] "For You" grid shows dramas (6 items)
- [ ] "Latest Dramas" section shows dramas
- [ ] Drama thumbnails load correctly
- [ ] View counts display (e.g., "32M views")
- [ ] Categories/themes show on cards
- [ ] Infinite scroll works (scroll to bottom, more dramas load)
- [ ] Loading spinner appears during data fetch
- [ ] "All dramas loaded" message appears at end

**Console Output to Check**:
```
📤 API Request #1: GET /api/v1/series?pageSize=15 [Authenticated]
✅ API Response: /api/v1/series?pageSize=15 [200] - 15 items
```

## 📂 Category Page Testing

- [ ] Category page opens from bottom navigation
- [ ] Category tags display at top
- [ ] Clicking a category filters the list
- [ ] Active category is highlighted (red background)
- [ ] Filtered dramas display correctly
- [ ] All categories are clickable
- [ ] Empty state shows if no dramas in category

**Categories to Test**:
- Romance
- Billionaire
- Against All Odds
- Contemporary
- Fantasy

## 🏆 Rank Page Testing

- [ ] Rank page opens from bottom navigation
- [ ] Two tabs present: "Trending" and "Latest"
- [ ] Trending tab shows by default
- [ ] Rank badges show (🥇🥈🥉) for top 3
- [ ] View counts display correctly
- [ ] Episode counts show (if available)
- [ ] Clicking "Latest" tab sorts differently
- [ ] Dramas are clickable

**Expected Behavior**:
- Trending: Sorted by most views
- Latest: Sorted by newest (highest ID)

## 🔍 Search Page Testing

### Empty State (No Query)
- [ ] Search input is focused on page load
- [ ] "Trending Now" section displays
- [ ] Shows top 10 trending dramas
- [ ] Each drama has rank badge (1-10)

### With Search Query
- [ ] Type in search box (e.g., "love")
- [ ] Results appear after ~400ms debounce
- [ ] Result count displays ("X results for 'love'")
- [ ] Results are relevant to query
- [ ] Searching by category works (e.g., "Romance")
- [ ] Clear button (X) clears search

### No Results
- [ ] Type gibberish (e.g., "xyzabc123")
- [ ] Shows "No results" message
- [ ] Suggests "Try different keywords"

## 🎬 Watch Page Testing

**Expected**: Watch page now works with Shortical CloudFront CDN

- [ ] Click a drama from any page
- [ ] URL shows `/watch/{id}`
- [ ] Video player loads and displays
- [ ] HLS video starts playing automatically
- [ ] Play/pause button works
- [ ] Volume control works
- [ ] Progress bar shows current position
- [ ] Seeking works (click on progress bar)
- [ ] Swipe up to go to next episode
- [ ] Swipe down to go to previous episode
- [ ] Episode list button shows all episodes
- [ ] Info button shows drama details
- [ ] Top bar shows drama name and episode number

**Video URL Format**: `https://dirjqbe1kaah2.cloudfront.net/{id}/{episode}/video.m3u8`

**Note**: Episodes start at index 1 (first episode = `/1/video.m3u8`)

## ⏯️ Continue Watching Testing

**Setup**: Open a drama (even if watch page doesn't work), then return home

- [ ] "Continue Watching" banner appears at bottom
- [ ] Shows correct drama thumbnail
- [ ] Shows drama title
- [ ] Shows episode progress
- [ ] Progress bar reflects position
- [ ] Clicking banner navigates to watch page
- [ ] Banner persists across page reloads

## 🔄 Data Persistence Testing

### Refresh the Page
- [ ] Navigate to different pages
- [ ] Refresh browser (F5)
- [ ] Data loads again successfully
- [ ] Continue watching persists
- [ ] No authentication errors

### Clear Cache and Test
- [ ] Open DevTools > Application > Storage
- [ ] Click "Clear site data"
- [ ] Refresh page
- [ ] Firebase re-authenticates automatically
- [ ] Data loads successfully

## 📱 Responsive Testing

- [ ] Open DevTools > Device Mode (Ctrl+Shift+M)
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPad (768px)
- [ ] Test on Desktop (1920px)
- [ ] All layouts look correct
- [ ] Touch interactions work
- [ ] Scroll works smoothly

## 🐛 Error Handling Testing

### Test Network Errors
1. Open DevTools > Network
2. Set throttle to "Offline"
3. Try to load data

- [ ] Graceful error handling (no crashes)
- [ ] User-friendly error messages
- [ ] Console shows network error logs

### Test Invalid ID
1. Navigate to `/watch/99999` (invalid ID)

- [ ] Shows "Drama not found" message
- [ ] Has "Back to Home" button
- [ ] Clicking button returns home

## 📊 Performance Testing

### Initial Load
- [ ] Home page loads in < 3 seconds
- [ ] No console errors
- [ ] No memory leaks

### Scrolling
- [ ] Infinite scroll smooth
- [ ] No lag or jank
- [ ] Loading states show correctly

### Navigation
- [ ] Page transitions are smooth
- [ ] No unnecessary re-renders
- [ ] Data caches appropriately

## 🎯 API Testing Checklist

Open browser console and run these commands:

### Test 1: Check Current User
```javascript
console.log('User:', auth.currentUser?.uid);
// Expected: User ID string
```

### Test 2: Get Token
```javascript
auth.currentUser?.getIdToken().then(t => console.log('Token:', t.substring(0, 50)));
// Expected: Token starting with "eyJ..."
```

### Test 3: Manual API Call
```javascript
fetch('https://prod.shortical.com/api/v1/series?pageSize=3', {
  headers: {
    'Authorization': 'Bearer ' + await auth.currentUser.getIdToken()
  }
})
.then(r => r.json())
.then(d => console.log('Series:', d.length, 'items'));
// Expected: "Series: 3 items"
```

## 🚨 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: 
1. Check Firebase logs in console
2. Verify .env has correct Firebase config
3. Restart dev server
4. Clear browser cache

### Issue: No Data Loads
**Solution**:
1. Check network tab for failed requests
2. Verify API requests have Bearer token
3. Check console for errors
4. Test manual API call (Test 3 above)

### Issue: Firebase Doesn't Initialize
**Solution**:
1. Check .env file exists
2. Verify all VITE_FIREBASE_* variables are set
3. Check for syntax errors in .env
4. Restart dev server

### Issue: Infinite Loop / Too Many Requests
**Solution**:
1. Check hooks for useEffect dependencies
2. Look for circular state updates
3. Check browser console for warnings
4. Refresh page

## ✅ Final Checklist

Before considering migration complete:

- [ ] All authentication tests pass
- [ ] Home page loads and works
- [ ] Categories filter correctly
- [ ] Rankings display properly
- [ ] Search returns results
- [ ] Continue watching persists
- [ ] No console errors
- [ ] Bearer token attached to requests
- [ ] Data from prod.shortical.com displays
- [ ] Infinite scroll functional
- [ ] Responsive on mobile

## 📝 Test Results

**Date**: __________
**Tester**: __________
**Browser**: __________
**Result**: ⬜ Pass  ⬜ Fail

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

**Issues Found**:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Next Steps**:
- [ ] _________________________________________
- [ ] _________________________________________
- [ ] _________________________________________
