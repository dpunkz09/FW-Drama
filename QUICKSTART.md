# Quick Start Guide

## ⚡ Get Up and Running in 5 Minutes

### Step 1: Get Your Bearer Token

1. **Open Shortical in your browser**:
   ```
   https://shortical.com
   ```

2. **Sign in with Google** (if not already signed in)

3. **Open Browser Console** (`F12` → Console tab)

4. **Run the token extractor**:
   - Open the file `extract-token.js` in this folder
   - Copy the entire contents
   - Paste into browser console
   - Press Enter

5. **Token is copied!** The script automatically copies it to your clipboard

### Step 2: Add Token to .env

1. **Open `.env` file** in this project folder

2. **Find this line**:
   ```env
   VITE_BEARER_TOKEN=
   ```

3. **Paste your token** (Ctrl+V):
   ```env
   VITE_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU4Y...
   ```

4. **Save the file**

### Step 3: Start the App

```bash
npm install
npm run dev
```

Open http://localhost:5173

## ✅ You're Done!

You should now see:
- ✅ Dramas loading on the home page
- ✅ Categories working
- ✅ Search functional
- ✅ No 401 errors

## 🔄 When Token Expires (Every Hour)

Your token expires after 1 hour. When you see 401 errors:

1. Refresh shortical.com in your browser
2. Run `extract-token.js` again in console
3. Update VITE_BEARER_TOKEN in .env
4. Restart dev server

## 🆘 Troubleshooting

### "⚠️ API Request #X: [No Token]"
- You haven't added VITE_BEARER_TOKEN to .env yet
- Follow Step 2 above

### "🔒 Unauthorized: Bearer token is invalid or expired"
- Your token expired (happens every hour)
- Get a new token (Step 1)
- Update .env (Step 2)
- Restart server

### "❌ ERROR: Not signed in to Shortical"
- Make sure you're on https://shortical.com
- Click "Sign In" and authenticate with Google
- Try the extract script again

### Changes in .env not taking effect
- Stop the dev server (Ctrl+C)
- Start it again (npm run dev)
- Vite needs restart to load new environment variables

## 📚 More Information

- **Token Extraction**: See `GET_TOKEN.md`
- **Full Setup Guide**: See `SETUP.md`
- **Authentication Details**: See `AUTHENTICATION.md`
- **Testing Checklist**: See `TEST_CHECKLIST.md`

## 🎯 What Works

✅ Home page with infinite scroll  
✅ Category filtering  
✅ Rankings (trending/latest)  
✅ Search  
✅ Continue watching (if Supabase configured)  

❌ Watch page (video streaming not yet implemented)

## 🔐 Security Note

**Never commit `.env` to Git!**

Your bearer token gives access to your Shortical account. The `.gitignore` already excludes it, but double-check before pushing.
