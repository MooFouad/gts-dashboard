# 🚨 IMMEDIATE FIX FOR ABSHER CONFIGURATION

Your database still has **QA configuration**. Follow these steps **EXACTLY** to fix it:

---

## 🎯 STEP 1: Run the Fix Script

Open a **NEW terminal window** and run:

```bash
cd C:\web\GTS\dashboard\fullstack\backend
node scripts/fixAbsherConfigNow.js
```

### Expected Output:
```
🔧 FIXING ABSHER CONFIGURATION
=============================================================
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 1 Absher configuration(s)

📋 CURRENT Configuration:
   ID: 66c7e8f9a...
   Client ID: ***25a2
   Auth Server: https://idp.apps.devocp4.elm.sa
   Realm Name: Tamm-QA
   Status: active

🔄 Updating to PRODUCTION...

✅ UPDATED to Production:
   Auth Server: https://idp.elm.sa
   Realm Name: Tamm

=============================================================
✅ DATABASE UPDATE COMPLETE!
=============================================================
```

---

## 🎯 STEP 2: RESTART Backend Server

This is **CRITICAL** - you MUST restart:

```bash
# In your backend terminal:
# Press Ctrl+C to stop the server
# Then start it again:
node server.js
```

---

## 🎯 STEP 3: Verify the Logs

After restart, you should see:

### ✅ CORRECT (Production):
```
🔧 Absher Service initialized with DATABASE configuration
   Auth URL: https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token
   API URL: https://tamm.api.elm.sa
   Client ID: ***25a2
   Realm: Tamm  ← PRODUCTION!
```

### ❌ WRONG (Still QA):
```
🔧 Absher Service initialized with DATABASE configuration
   Auth URL: https://idp.apps.devocp4.elm.sa/auth/realms/Tamm-QA/...
   Realm: Tamm-QA  ← Still QA!
```

If you still see QA after restart, try:
```bash
# Delete cache and restart
rm -rf node_modules/.cache 2>/dev/null || echo "No cache"
node server.js
```

---

## ⚠️ ABOUT THE TIMEOUT ERROR

**Even after fixing the configuration**, you will likely still see:
```
❌ Error generating access token: connect ETIMEDOUT
```

This is **EXPECTED** and **NORMAL** if you don't have:
1. ✅ VPN connected to Saudi Arabia
2. ✅ IP whitelisted in Absher Business Portal
3. ✅ Production credentials (not QA credentials)

### The Key Thing to Check:
**Look at the URLs in your logs, NOT the timeout error!**

- ✅ **Good**: Logs show `https://idp.elm.sa` and `Realm: Tamm`
- ❌ **Bad**: Logs show `https://idp.apps.devocp4.elm.sa` and `Realm: Tamm-QA`

---

## 🔍 Troubleshooting

### Issue 1: Script Says "No configuration found"
**Solution**: Configure Absher via UI first:
1. Go to Dashboard → Absher tab
2. Click Settings/Configuration
3. Enter any credentials (just to create the record)
4. Run the script again

### Issue 2: Script Runs But Logs Still Show QA
**Solution**: Backend service is caching. Try:
```bash
# Restart backend completely
# Close terminal and open new one
cd C:\web\GTS\dashboard\fullstack\backend
node server.js
```

### Issue 3: "MONGODB_URI not found"
**Solution**: Check your `.env` file exists and contains:
```env
MONGODB_URI=mongodb+srv://...your-connection-string...
```

---

## 📊 Summary

| What | Before | After |
|------|--------|-------|
| Auth URL | `idp.apps.devocp4.elm.sa` | `idp.elm.sa` ✅ |
| Realm | `Tamm-QA` | `Tamm` ✅ |
| API URL | `tamm-api.elm.sa` (wrong) | `tamm.api.elm.sa` ✅ |

---

## 🚀 Quick Commands

```bash
# 1. Fix database
cd C:\web\GTS\dashboard\fullstack\backend
node scripts/fixAbsherConfigNow.js

# 2. Restart backend (Ctrl+C first)
node server.js

# 3. Check logs - Should show Production URLs

# 4. If still shows QA, force refresh:
rm -rf node_modules/.cache 2>/dev/null
node server.js
```

---

## ✅ Success Criteria

After the fix, your logs should show:
- ✅ `Auth URL: https://idp.elm.sa/auth/realms/Tamm/...`
- ✅ `API URL: https://tamm.api.elm.sa`
- ✅ `Realm: Tamm`

The **timeout error** is a **separate issue** (VPN/credentials) and will be fixed once you:
1. Connect to Saudi VPN
2. Use Production credentials
3. Whitelist your IP

---

**Run the script NOW and let me know what you see!** 🚀
