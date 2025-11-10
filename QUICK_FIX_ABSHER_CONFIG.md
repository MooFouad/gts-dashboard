# Quick Fix: Update Absher Configuration to Production

## Problem
Your database configuration is still using QA environment:
- ❌ Auth URL: `https://idp.apps.devocp4.elm.sa/auth/realms/Tamm-QA/...`
- ❌ API URL: `https://tamm-api.elm.sa` (wrong - missing .api)
- ❌ Realm: `Tamm-QA`

## Solution - Choose ONE method:

---

## Method 1: Via Dashboard UI (EASIEST)

### Step 1: Open Absher Settings
1. Go to your dashboard: http://localhost:5173 (or your frontend URL)
2. Click on **Absher** tab
3. Look for **Settings** or **Configuration** button/icon

### Step 2: Update These Fields
```
Authorization Server: https://idp.elm.sa
Realm Name: Tamm
Client ID: [Your PRODUCTION Client ID]
Client Secret: [Your PRODUCTION Client Secret]
Status: active
```

### Step 3: Save and Test
1. Click **Save**
2. Click **Test Connection**
3. Restart backend server

---

## Method 2: Run Update Script

```bash
cd backend
node scripts/updateAbsherConfigToProduction.js
```

Then restart backend:
```bash
node server.js
```

---

## Method 3: Direct MongoDB Update

If you have MongoDB access, run this:

```javascript
// Connect to MongoDB
use your_database_name

// Update the configuration
db.absherconfigs.updateOne(
  { status: 'active' },
  {
    $set: {
      authorizationServer: 'https://idp.elm.sa',
      realmName: 'Tamm',
      notes: 'Production Environment'
    }
  }
)

// Verify the update
db.absherconfigs.findOne({ status: 'active' })
```

---

## Method 4: Delete Old Config & Re-enter via UI

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const AbsherConfig = require('./models/AbsherConfig');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await AbsherConfig.deleteMany({});
  console.log('✅ All Absher configs deleted');
  console.log('💡 Now go to UI and enter PRODUCTION credentials');
  process.exit(0);
});
"
```

Then:
1. Go to Dashboard → Absher Settings
2. Enter your **PRODUCTION** credentials
3. Use these URLs:
   - Authorization Server: `https://idp.elm.sa`
   - Realm Name: `Tamm`

---

## What Should You See After Fix:

```
🔧 Absher Service initialized with DATABASE configuration
   Auth URL: https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token
   API URL: https://tamm.api.elm.sa
   Client ID: ***25a2
   Realm: Tamm  ← PRODUCTION!
```

---

## About the ETIMEDOUT Error

Even after fixing the config, you might still get timeout. This is normal if:

1. **No VPN Connected** - Absher servers require Saudi Arabia IP
2. **IP Not Whitelisted** - Your IP must be whitelisted in Absher Business Portal
3. **Wrong Credentials** - QA credentials won't work with Production URLs

### To Fix Timeout:
1. ✅ Connect to Saudi Arabia VPN
2. ✅ Whitelist your IP in Absher Business Portal
3. ✅ Use PRODUCTION credentials (not QA)

---

## Test Without VPN (To Verify URLs are Correct)

Even if it times out, you should see it trying to connect to PRODUCTION URLs:

```bash
# Test connection (will timeout if no VPN, but shows correct URL)
curl -v -X POST https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&grant_type=client_credentials"
```

Expected: Connection timeout (if no VPN) OR 401 Unauthorized (if wrong credentials) OR 200 Success (if everything is correct)

---

## Quick Checklist:

- [ ] Database config updated to Production URLs
- [ ] Using PRODUCTION credentials (not QA)
- [ ] Backend restarted after config change
- [ ] VPN connected to Saudi Arabia (if outside Saudi)
- [ ] IP whitelisted in Absher Business Portal
- [ ] Test connection shows PRODUCTION URLs in logs
