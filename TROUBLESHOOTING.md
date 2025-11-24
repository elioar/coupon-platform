# Troubleshooting Google Maps API Error

## Your APIs Are Enabled ✅

I can see you have enabled:
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Geocoding API

But you're still getting `ApiNotActivatedMapError`. This is usually an **API key restriction** issue.

## Fix: Check API Key Restrictions

### Step 1: Go to Credentials
1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click on your API key

### Step 2: Check API Restrictions
Look for **"API restrictions"** section:

**Option A: For Testing (Recommended)**
- Select **"Don't restrict key"**
- Click **"SAVE"**
- Wait 1-2 minutes
- Refresh your app

**Option B: For Production**
- Select **"Restrict key"**
- Under "Select APIs", make sure these are checked:
  - ✅ Maps JavaScript API
  - ✅ Places API
  - ✅ Geocoding API
- Click **"SAVE"**

### Step 3: Check Application Restrictions
Look for **"Application restrictions"** section:

**For Local Development:**
- Select **"HTTP referrers (web sites)"**
- Click **"ADD AN ITEM"**
- Add these referrers:
  - `localhost:3000/*`
  - `127.0.0.1:3000/*`
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`
- Click **"SAVE"**

**For Production:**
- Add your production domain:
  - `yourdomain.com/*`
  - `https://yourdomain.com/*`

### Step 4: Verify Environment Variable
Make sure in your `.env` file you have:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-actual-api-key-here"
```

**Important:** 
- No quotes needed around the key
- No spaces before/after
- Must start with `NEXT_PUBLIC_` for client-side use

### Step 5: Restart Dev Server
After making changes:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 6: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or use incognito/private window

## Still Not Working?

### Check Billing
1. Go to **Billing** in Google Cloud Console
2. Make sure billing is enabled for your project
3. Even free tier requires billing to be enabled

### Verify API Key is Correct
1. Go to **APIs & Services** → **Credentials**
2. Copy your API key
3. Check it matches exactly what's in your `.env` file
4. Make sure there are no extra spaces or characters

### Test API Key Directly
Try loading this URL in your browser (replace YOUR_API_KEY):
```
https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places
```

If you see JavaScript code, the key works.
If you see an error, the key or restrictions are wrong.

### Check Console for Specific Error
Open browser DevTools (F12) → Console tab
Look for the exact error message - it might give more details.

## Quick Checklist

- [ ] APIs are enabled (✅ You have this)
- [ ] API key restrictions allow Maps JavaScript API
- [ ] Application restrictions allow localhost (for dev)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is in `.env` file
- [ ] API key value is correct (no typos)
- [ ] Dev server restarted after adding key
- [ ] Browser cache cleared
- [ ] Billing is enabled

