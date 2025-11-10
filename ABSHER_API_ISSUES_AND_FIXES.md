# Absher API Integration Issues & Fixes

## Summary
After analyzing the **Profile Management Integration Guide PDF** and comparing it with your implementation, I found several critical issues that were preventing successful API authentication.

---

## Issues Found & Fixed ✅

### 1. **Incorrect Production API URL** (CRITICAL)
**Problem**: The API base URL was incorrect for production.
- ❌ **Wrong**: `https://api.elm.sa`
- ✅ **Correct**: `https://tamm.api.elm.sa` (per PDF page 9)

**Fixed in**:
- `backend/.env.example` line 78
- `backend/services/absherService.js` line 34

---

### 2. **Backend Defaults Using QA Environment**
**Problem**: The database model was defaulting to QA/Staging environment instead of Production.
- ❌ **Was**: `https://idp.apps.devocp4.elm.sa` + `Tamm-QA`
- ✅ **Now**: `https://idp.elm.sa` + `Tamm`

**Fixed in**:
- `backend/models/AbsherConfig.js` lines 28 and 38

---

### 3. **Possible Client ID / Link ID Confusion**
**Problem**: The hardcoded credentials in frontend might be using **Link ID** (معرف الربط) instead of **OAuth Client ID** (رقم العميل).

According to the PDF, there are THREE separate credentials:
1. **رقم العميل** (Client ID) - OAuth Client ID for authentication ← **Use this for clientId**
2. **معرف الربط** (Link ID) - Optional integration tracking ID
3. **الكتلة السرية** (Client Secret) - OAuth Client Secret for authentication

**Action Required**:
- Update the `clientId` and `clientSecret` in the Absher settings UI with your **actual OAuth credentials** from Absher Business Portal
- The current hardcoded values (`3fd125a2` and `42d53a3e57bfc9e87a7391c3ce633ce1`) might be incorrect

**Fixed in**:
- `frontend/src/components/absher/AbsherIntegrationSettings.jsx` - Added clarifying comments

---

## Authentication Flow (from PDF)

### Client Credentials Flow (OIDC OAuth2)
```
1. POST to Token Endpoint:
   URL: https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token

   Headers:
   - Content-Type: application/x-www-form-urlencoded

   Body (form-urlencoded):
   - client_id: <your-oauth-client-id>
   - client_secret: <your-oauth-client-secret>
   - grant_type: client_credentials

2. Response:
   {
     "access_token": "eyJhbGciOiJSUzI1...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }

3. Use Access Token in API Calls:
   Headers:
   - Authorization: Bearer <access_token>
```

---

## Environment Configuration

### Production (Default)
```env
# IdP (Identity Provider)
TAMM_AUTH_URL=https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token
TAMM_API_URL=https://tamm.api.elm.sa

# Your Credentials
TAMM_CLIENT_ID=<your-actual-client-id>
TAMM_CLIENT_SECRET=<your-actual-client-secret>
```

### QA/Staging (For Testing)
```env
# IdP (Identity Provider)
TAMM_AUTH_URL=https://idp.apps.devocp4.elm.sa/auth/realms/Tamm-QA/protocol/openid-connect/token
TAMM_API_URL=https://tamm-qa-api.apps.devocp4.elm.sa

# Your Credentials
TAMM_CLIENT_ID=<your-qa-client-id>
TAMM_CLIENT_SECRET=<your-qa-client-secret>
```

---

## How to Get Your Credentials

1. **Login to Absher Business Portal**:
   - Production: https://business.absher.sa
   - Register your company/establishment

2. **Navigate to API Integration Section**:
   - Look for "التكامل عبر الخدمات" or "API Integration"
   - Find "الربط الذكي" (Smart Integration)

3. **Get OAuth Credentials**:
   - **رقم العميل** (Client ID) ← Copy this
   - **الكتلة السرية** (Client Secret/Key) ← Copy this
   - **معرف الربط** (Link ID) ← Optional, for tracking

4. **Configure in Dashboard**:
   - Go to: **Absher Settings** in your GTS Dashboard
   - Enter the credentials in the form
   - Click "اختبار الاتصال" (Test Connection)
   - If successful, click "حفظ" (Save)

---

## Testing the Connection

### Via Dashboard UI:
1. Navigate to: **Absher Integration Settings**
2. Enter your credentials
3. Click: **اختبار الاتصال** (Test Connection)
4. You should see: ✅ "نجح الاتصال بـ API أبشر!" (Connection successful!)

### Via API Endpoint:
```bash
curl -X GET http://localhost:5000/api/absher/test-connection \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Common Errors & Solutions

### Error: "ETIMEDOUT" or "Connection timeout"
**Causes**:
- ✅ VPN required (Absher servers are in Saudi Arabia)
- ✅ IP not whitelisted in Absher Business dashboard
- ✅ Network connectivity issues

**Solutions**:
1. Connect to Saudi Arabia VPN
2. Check IP whitelist in Absher Business portal
3. Contact Absher support to whitelist your server IP

### Error: "401 Unauthorized" or "Invalid credentials"
**Causes**:
- ❌ Wrong Client ID
- ❌ Wrong Client Secret
- ❌ Using Link ID instead of Client ID

**Solutions**:
1. Double-check credentials from Absher Business Portal
2. Make sure you're using **رقم العميل** (Client ID), NOT **معرف الربط** (Link ID)
3. Check for extra spaces when copy-pasting credentials

### Error: "ENOTFOUND" or "DNS error"
**Causes**:
- ❌ Wrong IdP URL

**Solutions**:
1. Production: `https://idp.elm.sa`
2. QA: `https://idp.apps.devocp4.elm.sa`

### Error: "403 Forbidden"
**Causes**:
- ❌ API permissions not enabled in Absher Business
- ❌ Subscription not active

**Solutions**:
1. Check subscription status in Absher Business portal
2. Ensure required API permissions are enabled

---

## Next Steps

1. ✅ **Fixes Applied** - All code issues have been corrected
2. 🔄 **Get Correct Credentials** - Login to Absher Business Portal and get your OAuth Client ID & Secret
3. 🔄 **Update Configuration** - Enter credentials in the Absher Settings UI
4. 🔄 **Test Connection** - Click "Test Connection" button
5. 🔄 **Save Configuration** - Save the settings
6. 🔄 **Test API Calls** - Try fetching vehicle insurance data

---

## Files Modified

1. `backend/.env.example` - Fixed production API URL
2. `backend/models/AbsherConfig.js` - Changed defaults from QA to Production
3. `backend/services/absherService.js` - Updated fallback API URL
4. `frontend/src/components/absher/AbsherIntegrationSettings.jsx` - Added clarifying comments

---

## References

- **Profile Management Integration Guide** (v0.2) - Page 5 (Authentication)
- **Profile Management Integration Guide** (v0.2) - Page 9 (Service Configuration)
- ChatGPT Arabic Hint about OIDC Client Credentials flow

---

## Need Help?

If you're still experiencing issues after applying these fixes:

1. **Check the backend logs** - Look for detailed error messages
2. **Verify credentials** - Make absolutely sure you have the correct OAuth Client ID (not Link ID)
3. **Check VPN** - Absher servers might require Saudi Arabia VPN
4. **Contact Absher Support** - They can verify your credentials and API access

Good luck! 🚀
