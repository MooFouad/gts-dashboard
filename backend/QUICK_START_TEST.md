# Quick Start - Test Absher LoadProfile Fix

## What Changed

The HTTP 500 "No value present" error has been fixed by implementing the LoadProfile API call. The issue was that we were using the MOI number directly instead of first calling LoadProfile to get the correct User ID.

## Quick Test (5 minutes)

### Step 1: Add Missing Environment Variable

Open your `.env` file and add your **National ID or Iqama number**:

```bash
# Add this line (replace with your actual National ID/Iqama):
TAMM_USER_ID_NUMBER=1023782800
```

**Where to find it:**
- This is the National ID (بطاقة الهوية) or Iqama number (إقامة) associated with your Absher Business account
- Should be the same ID used when you registered in Absher Business Portal
- Check your Absher Business account profile/settings


### Step 2: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd C:\web\GTS\dashboard\fullstack\backend
node server.js
```

### Step 3: Test the Complete Flow

**Option A: Simple Test (No parameters needed)**

```bash
curl -X POST http://localhost:5000/api/absher/istemarah/test-search-with-profile -H "Content-Type: application/json" -d "{}"
```

This will:
1. ✅ Read `TAMM_USER_ID_NUMBER` and `TAMM_CUSTOMER_ID` from your `.env`
2. ✅ Call LoadProfile API
3. ✅ Get the correct User ID
4. ✅ Search Istemarah with that User ID

**Option B: Specify Parameters**

```bash
curl -X POST http://localhost:5000/api/absher/istemarah/test-search-with-profile ^
  -H "Content-Type: application/json" ^
  -d "{\"userIdNumber\":\"1023782800\",\"accountMoiNumber\":\"7001486054\"}"
```

### Step 4: Check the Logs

**✅ Success - Look for these in the console:**

```
🧪🧪🧪🧪 TESTING COMPLETE FLOW: LoadProfile + Search Istemarah 🧪🧪🧪🧪

📋 STEP 1: Loading user profile...
================================================================================
🔍 ABSHER API CALL - Load Profile
📋 User ID Number: 1023782800
📋 Account MOI Number: 7001486054
✅ Response received from Absher API
✅ User ID extracted: 71000    <-- THIS IS THE CORRECT ID TO USE!
   User Email: client@elm.sa
   User Type: HQ_ADMIN
   Account MOI: 7001486054

📋 STEP 2: Searching Istemarah with correct User ID...
🔍 ABSHER API CALL - Step 3: Search Renewed Istemarah
✅ Response received from Absher API
📊 Response Status: 200    <-- SUCCESS!
✅ Successfully fetched renewed Istemarah records
```

**❌ If Still Getting Errors:**

1. **"User ID Number and Account MOI Number are required"**
   - Make sure you added `TAMM_USER_ID_NUMBER` to `.env`
   - Restart the backend server

2. **"Authentication failed"**
   - Your OAuth credentials work (we confirmed this before)
   - This is a different issue - check VPN/network

3. **"Profile not found" or similar**
   - The National ID might not match what's registered in Absher
   - Double-check the National ID number
   - Verify it's associated with MOI number `7001486054`

## What the Logs Should Show

### Before (Wrong - Using MOI Number):
```
X-Integrator-User-Id: 7001486054    <-- WRONG! This is MOI number
❌ Response Status: 500
❌ "No value present"
```

### After (Correct - Using User ID from LoadProfile):
```
✅ User ID extracted: 71000    <-- Correct User ID from LoadProfile
X-Integrator-User-Id: 71000    <-- CORRECT! Using User ID
✅ Response Status: 200
✅ Successfully fetched records
```

## Understanding the Response

```json
{
  "success": true,
  "message": "Test completed - Profile loaded and search executed",
  "data": {
    "profile": {
      "userId": 71000,          // ← Use THIS in future API calls
      "profile": {
        "user": {
          "id": 71000,
          "email": "client@elm.sa",
          "userType": "HQ_ADMIN",
          "branch": {
            "account": {
              "moiNumber": 7001486054  // ← This is different from User ID!
            }
          }
        }
      }
    },
    "searchResults": {
      "content": [
        // Array of Istemarah records (vehicles)
      ],
      "totalElements": 25,
      "totalPages": 1,
      "size": 100,
      "number": 0
    }
  }
}
```

## Key Points

### Three Different Numbers:

1. **National ID / Iqama**: `1023782800`
   - Your personal identification
   - Used in LoadProfile API call
   - Stored in `TAMM_USER_ID_NUMBER` env variable

2. **MOI Account Number**: `7001486054`
   - Your company's MOI account
   - Used in LoadProfile API call
   - Already in your `.env` as `TAMM_CUSTOMER_ID`

3. **User ID**: `71000` (example)
   - **Returned from LoadProfile API**
   - **This is what goes in X-Integrator-User-Id header**
   - **You can't know this until you call LoadProfile!**

### The Fix Explained:

**Before (Wrong):**
```javascript
// ❌ Direct use of MOI number - causes "No value present" error
headers: {
  'X-Integrator-User-Id': '7001486054'  // MOI number - WRONG!
}
```

**After (Correct):**
```javascript
// ✅ First call LoadProfile to get User ID
const profile = await loadProfile(nationalId, moiNumber);
const userId = profile.userId;  // e.g., 71000

// ✅ Then use that User ID in subsequent calls
headers: {
  'X-Integrator-User-Id': userId  // User ID from LoadProfile - CORRECT!
}
```

## Next Steps After Successful Test

1. The backend now has the `loadProfile()` method available
2. The test endpoint demonstrates the correct flow
3. You can integrate this pattern into your UI/frontend:
   - Call LoadProfile once when user opens Absher section
   - Cache the User ID for that session
   - Use it for all Absher API calls

## Need Help?

Check `ABSHER_LOADPROFILE_FIX.md` for:
- Detailed explanation of the problem
- Full API documentation
- Troubleshooting guide
- Environment variable reference

## Reference

- **Profile Management Integration Guide** (in `/data` folder), Page 8, Section 5
- Your credentials: Check Absher Business Portal (https://www.absher.sa)
