# Fix: ApiNotActivatedMapError - API Key Restrictions

## The Problem

Even though the APIs are enabled, your API key might be restricted and not allowing access to **Maps JavaScript API**.

## Solution: Check API Key Restrictions

### Step 1: Open Your API Key Settings

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find your **"Maps Platform API Key"**
3. Click on the key name (or click the three dots → **Edit**)

### Step 2: Check "API restrictions"

Look for the **"API restrictions"** section. You'll see one of two options:

#### Option A: "Don't restrict key" (Recommended for Testing)
- Select **"Don't restrict key"**
- This allows access to all enabled APIs
- Click **"SAVE"**

#### Option B: "Restrict key" (Current Setting)
If it says "Restrict key" and shows "31 APIs":
- Click on **"Restrict key"**
- You'll see a list of APIs
- Make sure these are **checked**:
  - ✅ **Maps JavaScript API** (THIS IS CRITICAL!)
  - ✅ **Places API**
  - ✅ **Geocoding API**
- If "Maps JavaScript API" is NOT checked, check it
- Click **"SAVE"**

### Step 3: Check "Application restrictions"

Also check the **"Application restrictions"** section:

**For Local Development:**
- Select **"HTTP referrers (web sites)"**
- Click **"ADD AN ITEM"**
- Add these:
  - `localhost:3000/*`
  - `127.0.0.1:3000/*`
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`
- Click **"SAVE"**

**OR for Testing:**
- Select **"None"** (temporarily, for testing only)

### Step 4: Wait and Restart

1. Wait **2-3 minutes** for changes to propagate
2. Restart your dev server:
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```
3. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Try typing in the location field again

## Quick Test

After making changes, test if the key works:

Open this URL in your browser (replace YOUR_KEY):
```
https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places
```

- ✅ If you see JavaScript code → Key works!
- ❌ If you see an error → Restrictions are still wrong

## Most Common Issue

The key has "31 APIs" restricted, but **Maps JavaScript API** is not in that list. Make sure to:
1. Edit the key
2. Under "API restrictions", find and check **"Maps JavaScript API"**
3. Save

