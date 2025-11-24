# Fix: RefererNotAllowedMapError

## The Problem

Your API key is working, but it's restricted to only allow certain websites. Your current URL `http://192.168.1.131:3000` is not in the allowed list.

## Solution: Add Your IP Address to Referrer Restrictions

### Step 1: Edit Your API Key

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find your **"Maps Platform API Key"**
3. Click on the key name (or three dots → **Edit**)

### Step 2: Update "Application restrictions"

1. Find the **"Application restrictions"** section
2. Make sure **"HTTP referrers (web sites)"** is selected
3. Click **"ADD AN ITEM"** or **"ADD HTTP REFERRER"**
4. Add these referrers one by one:

```
localhost:3000/*
127.0.0.1:3000/*
http://localhost:3000/*
http://127.0.0.1:3000/*
http://192.168.1.131:3000/*
http://192.168.1.131:3000/*
https://192.168.1.131:3000/*
192.168.1.131:3000/*
```

**Important:** Add both with and without `http://` prefix, and with `https://` too.

### Step 3: Alternative - Allow All Local IPs (For Development)

If you want to allow any local network IP, you can use wildcards:

```
localhost:3000/*
127.0.0.1:3000/*
192.168.*.*:3000/*
10.*.*.*:3000/*
172.16.*.*:3000/*
```

### Step 4: Save and Wait

1. Click **"SAVE"** at the bottom
2. Wait **2-3 minutes** for changes to propagate
3. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Quick Fix (For Testing Only)

If you want to test quickly without restrictions:

1. In **"Application restrictions"**, select **"None"**
2. Click **"SAVE"**
3. ⚠️ **Warning:** This allows the key to be used from anywhere. Only do this for testing, then add restrictions back!

## After Fixing

1. Restart your dev server (if needed)
2. Hard refresh: `Ctrl+Shift+R`
3. Try typing in the location field again

The autocomplete should now work! 🎉

