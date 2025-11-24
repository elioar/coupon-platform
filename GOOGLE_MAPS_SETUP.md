# Google Maps API Setup Guide

## Quick Fix for ApiNotActivatedMapError

This error means the **Maps JavaScript API** is not enabled in your Google Cloud project.

## Step-by-Step Instructions

### 1. Enable Maps JavaScript API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the correct project (check the project dropdown at the top)
3. Navigate to **APIs & Services** → **Library**
4. In the search bar, type: **"Maps JavaScript API"**
5. Click on **"Maps JavaScript API"** from the results
6. Click the **"ENABLE"** button
7. Wait for the confirmation message

### 2. Enable Places API

1. Still in **APIs & Services** → **Library**
2. Search for **"Places API"**
3. Click on **"Places API"**
4. Click **"ENABLE"**

### 3. Enable Geocoding API (for server-side)

1. Still in **APIs & Services** → **Library**
2. Search for **"Geocoding API"**
3. Click on **"Geocoding API"**
4. Click **"ENABLE"**

### 4. Verify API Key Configuration

1. Go to **APIs & Services** → **Credentials**
2. Click on your API key
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check these APIs:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
   - OR for testing: Select **"Don't restrict key"** (restrict later for production)
4. Click **"SAVE"**

### 5. Check Billing

- Google Maps requires a billing account (even for free tier)
- Go to **Billing** in the left menu
- Make sure billing is enabled for your project
- You get $200 free credit per month (usually covers most usage)

### 6. Restart Your Application

After enabling the APIs:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 7. Clear Browser Cache

- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache for localhost

## Verify APIs Are Enabled

To check if APIs are enabled:

1. Go to **APIs & Services** → **Enabled APIs**
2. You should see:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API

## Common Issues

### "API key not valid" error
- Make sure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in your `.env` file
- Restart your dev server after adding the key
- Verify the key is correct (no extra spaces)

### "RefererNotAllowedMapError"
- Go to **APIs & Services** → **Credentials**
- Click your API key
- Under **"Application restrictions"**, add:
  - `localhost:3000/*`
  - `127.0.0.1:3000/*`
  - Your production domain (e.g., `yourdomain.com/*`)

### Still getting errors after enabling?
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache completely
3. Try in an incognito/private window
4. Check the browser console for specific error messages

## Required APIs Summary

For the location autocomplete feature to work, you need:

1. **Maps JavaScript API** - Required for Places Autocomplete
2. **Places API** - Required for Places Autocomplete
3. **Geocoding API** - Required for server-side address to coordinates conversion

All three must be enabled in your Google Cloud project.

