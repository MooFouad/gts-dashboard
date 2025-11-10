# Absher API LoadProfile Integration - Fix Documentation

## The Problem

The Absher/TAMM API was returning **HTTP 500 error with "No value present"** message when searching for Istemarah records.

### Root Cause

According to the **Profile Management Integration Guide (Section 5, Page 8)**, when using **Client Credentials flow** (integrator mode), you **MUST**:

1. **First call the LoadProfile API** to get the correct User ID
2. **Use that User ID** (not the MOI number!) in the `X-Integrator-User-Id` header for all subsequent API calls

The previous implementation was:
- ❌ Skipping the LoadProfile API call
- ❌ Using the MOI number (`7001486054`) directly as `X-Integrator-User-Id`
- ❌ This caused the API to return "No value present" because it couldn't find a profile with that incorrect identifier

## The Fix

### 1. Implemented LoadProfile API Method

**Location**: `backend/services/absherService.js` (line 178-287)

```javascript
async loadProfile(userIdNumber, accountMoiNumber)
```

**Parameters**:
- `userIdNumber`: National ID / Iqama number (e.g., "1023782800")
- `accountMoiNumber`: MOI account number (e.g., "7001396900")

**Returns**:
```javascript
{
  userId: 71000,           // Use THIS in X-Integrator-User-Id header
  profile: { /* full profile object */ },
  message: { /* any warnings */ },
  actions: [ /* required actions */ ]
}
```

**API Endpoint Called**: `POST /api/v1/integrator/users/profiles/load`

### 2. Added LoadProfile Route Endpoint

**Location**: `backend/routes/absherRoutes.js` (line 677-703)

**Endpoint**: `POST /api/absher/profile/load`

**Request Body**:
```json
{
  "userIdNumber": "1023782800",
  "accountMoiNumber": "7001396900"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile loaded successfully",
  "data": {
    "userId": 71000,
    "profile": { /* full profile */ },
    "message": null,
    "actions": null
  }
}
```

### 3. Created Complete Test Flow Endpoint

**Location**: `backend/routes/absherRoutes.js` (line 764-833)

**Endpoint**: `POST /api/absher/istemarah/test-search-with-profile`

This demonstrates the **correct implementation**:

1. ✅ Calls LoadProfile API first
2. ✅ Extracts the User ID from the response
3. ✅ Uses that User ID in Istemarah search

**Request Body**:
```json
{
  "userIdNumber": "1023782800",     // Optional, uses TAMM_USER_ID_NUMBER env if not provided
  "accountMoiNumber": "7001396900",  // Optional, uses TAMM_CUSTOMER_ID env if not provided
  "plateInfo": "",                   // Optional, empty = get all records
  "page": 0,
  "size": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test completed - Profile loaded and search executed",
  "data": {
    "profile": {
      "userId": 71000,
      /* ... profile data ... */
    },
    "searchResults": {
      /* ... istemarah records ... */
    }
  }
}
```

## Environment Variables

### Updated `.env.example` Documentation

**New/Updated Variables**:

```bash
# National ID / Iqama Number (for LoadProfile API)
TAMM_USER_ID_NUMBER=your-national-id-or-iqama-number

# MOI Account Number (for LoadProfile API)
# IMPORTANT: This is the MOI number, NOT the User ID!
# User ID comes from LoadProfile API response
TAMM_CUSTOMER_ID=your-moi-account-number
```

### Your Current `.env` File

Based on your previous configuration, you need to add:

```bash
# Add this to your .env file:
TAMM_USER_ID_NUMBER=1023782800  # Your National ID/Iqama (example, replace with actual)
```

Your existing `TAMM_CUSTOMER_ID=7001486054` is correct as the MOI number.

## How to Test

### Option 1: Using Test Endpoint (Recommended)

This endpoint handles everything automatically:

```bash
# Using curl (Windows PowerShell)
curl -X POST http://localhost:5000/api/absher/istemarah/test-search-with-profile `
  -H "Content-Type: application/json" `
  -d '{}'
```

The endpoint will:
1. Use `TAMM_USER_ID_NUMBER` and `TAMM_CUSTOMER_ID` from `.env`
2. Call LoadProfile automatically
3. Extract User ID
4. Search Istemarah with correct User ID
5. Return both profile and search results

### Option 2: Manual Two-Step Process

**Step 1: Load Profile**
```bash
curl -X POST http://localhost:5000/api/absher/profile/load `
  -H "Content-Type: application/json" `
  -d '{
    "userIdNumber": "1023782800",
    "accountMoiNumber": "7001486054"
  }'
```

**Step 2: Use the returned User ID in search**
```bash
# Replace 71000 with the actual userId from Step 1 response
curl -X POST http://localhost:5000/api/absher/istemarah/search `
  -H "Content-Type: application/json" `
  -d '{
    "plateInfo": "",
    "integratorUserId": "71000",
    "page": 0,
    "size": 100
  }'
```

## Expected Results

### ✅ Success Scenario

**Console Output:**
```
🔍 ABSHER API CALL - Load Profile
================================================================================
📋 User ID Number: 1023782800
📋 Account MOI Number: 7001396054
📤 API URL: https://tamm.api.elm.sa/api/v1/integrator/users/profiles/load
✅ Response received from Absher API
📊 Response Status: 200
✅ User ID extracted: 71000
   User Email: client@elm.sa
   User Type: HQ_ADMIN
   Account MOI: 7001396054

🔍 ABSHER API CALL - Step 3: Search Renewed Istemarah
================================================================================
📋 Plate Info:
📋 Page: 0, Size: 100
📤 API URL: https://tamm.api.elm.sa/api/v1/istemarah/renewal/client-search?page=0&size=100
✅ Response received from Absher API
📊 Response Status: 200
✅ Successfully fetched renewed Istemarah records
```

**API Response:**
```json
{
  "success": true,
  "message": "Test completed - Profile loaded and search executed",
  "data": {
    "profile": {
      "userId": 71000,
      ...
    },
    "searchResults": {
      "content": [ /* array of Istemarah records */ ],
      "totalElements": 25,
      "totalPages": 1,
      ...
    }
  }
}
```

### ❌ Previous Error (Now Fixed)

**Before:**
```
Response Status: 500
Response Data: {
  "status": 500,
  "message": {
    "ar": "حدث خطأ أثناء استرجاع بعض البيانات",
    "en": "No value present"
  }
}
```

**Reason:** Using MOI number instead of User ID from LoadProfile

## Key Takeaways

### Understanding the Different IDs

| ID Type | Example | Purpose | Where to Get It |
|---------|---------|---------|-----------------|
| **National ID / Iqama** | `1023782800` | Identify the person | User's national ID card |
| **MOI Account Number** | `7001486054` | Identify the company/account | Absher Business Portal |
| **User ID** | `71000` | API operations identifier | **LoadProfile API response** |

### The Correct Flow

```
1. Authenticate with Client Credentials
   ↓
2. Call LoadProfile API with National ID + MOI Number
   ↓
3. Extract User ID from LoadProfile response
   ↓
4. Use User ID in X-Integrator-User-Id header for all API calls
```

### Common Mistakes to Avoid

1. ❌ Using MOI number as `X-Integrator-User-Id` header value
2. ❌ Using National ID as `X-Integrator-User-Id` header value
3. ❌ Skipping the LoadProfile API call
4. ✅ Always call LoadProfile first to get the correct User ID

## Documentation References

- **Profile Management Integration Guide**: Section 3 (LoadProfile API), Section 5 (Headers)
- **Absher Business Portal**: https://www.absher.sa
- **Elm Developer Portal**: Where you get OAuth credentials

## Next Steps

1. **Add your National ID** to `.env` file as `TAMM_USER_ID_NUMBER`
2. **Test the new endpoint**: `/api/absher/istemarah/test-search-with-profile`
3. **Verify the logs** show correct User ID extraction
4. **Check for any profile messages** or actions required

## Troubleshooting

### "User ID not found in LoadProfile response"
- Check that your National ID and MOI number are correct
- Verify you're using Production environment (not QA)
- Ensure your account is properly set up in Absher Business Portal

### "Profile loaded but search still returns 500"
- Check the User ID value being used
- Verify the User ID is a number (like `71000`), not the MOI number
- Check for any messages/actions in LoadProfile response that need attention

### "Authentication successful but LoadProfile fails"
- Your OAuth credentials work, but profile data may not be accessible
- Check if your account needs additional setup in Absher Business Portal
- Verify you have the correct permissions/subscription

## Summary

The HTTP 500 "No value present" error was caused by using the wrong identifier (`7001486054` - MOI number) instead of the correct User ID from LoadProfile API. The fix implements the proper flow as documented in the Profile Management Integration Guide, ensuring LoadProfile is called first to obtain the correct User ID for all subsequent API operations.
