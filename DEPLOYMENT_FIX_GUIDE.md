# 🚀 Deployment Fix Guide - Vercel Frontend + Render Backend

## Problem: "Failed after 3 attempts: NetworkError when attempting to fetch resource"

This error occurs when the frontend (Vercel) cannot communicate with the backend (Render) due to CORS blocking or incorrect API URL configuration.

---

## ✅ Solution: Configure Environment Variables

### **Step 1: Configure Render Backend (CRITICAL)**

Go to your Render dashboard → Select your backend service → Environment tab

**Set/Update these environment variables:**

```bash
# 🔴 MOST IMPORTANT - Add your Vercel frontend URL
ALLOWED_ORIGINS=https://your-frontend-app.vercel.app

# If you have multiple domains (custom domain + Vercel), use comma-separated:
# ALLOWED_ORIGINS=https://your-app.vercel.app,https://yourdomain.com

# 🔴 REQUIRED - Your frontend URL for email links
APP_URL=https://your-frontend-app.vercel.app

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Authentication
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# VAPID Keys for Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your-email@example.com

# Email Configuration (Brevo SMTP - recommended for Render)
EMAIL_SERVICE=
# ⚠️ Leave EMAIL_SERVICE empty! Gmail is BLOCKED on Render free tier

EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-login@example.com
EMAIL_PASS=your-brevo-smtp-key
EMAIL_FROM=your-verified-sender@example.com

# Notification Settings
NOTIFICATION_DAYS_BEFORE=10
NOTIFICATION_CHECK_HOUR=9
```

**After updating, click "Save Changes" and wait for Render to redeploy automatically.**

---

### **Step 2: Configure Vercel Frontend**

Go to your Vercel project → Settings → Environment Variables

**Add these variables:**

```bash
# 🔴 CRITICAL - Backend API URL (must end with /api)
VITE_API_URL=https://your-render-backend.onrender.com/api

# Example: If your Render backend is gts-dashboard-api.onrender.com:
VITE_API_URL=https://gts-dashboard-api.onrender.com/api

# VAPID Public Key (must match backend)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# App Info
VITE_APP_NAME=GTS Dashboard
VITE_USE_API=true
```

**After updating:**
1. Click "Save"
2. Go to Deployments tab
3. Click "..." on latest deployment → "Redeploy"
4. ✅ Check "Use existing Build Cache" (optional)
5. Click "Redeploy"

---

## 🧪 Testing After Deployment

### **Test 1: Backend Health Check**
Open in browser:
```
https://your-render-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2024-10-26T..."
}
```

If you see an error or nothing, check Render logs.

---

### **Test 2: CORS Headers**
Open browser DevTools (F12) → Network tab → Try to login

**Look for the `/api/auth/login` request:**
- Status should be `200 OK`
- Response Headers should include:
  ```
  access-control-allow-origin: https://your-vercel-app.vercel.app
  access-control-allow-credentials: true
  ```

If you see:
- ❌ CORS error → ALLOWED_ORIGINS not set correctly in Render
- ❌ 404 Not Found → VITE_API_URL incorrect in Vercel
- ❌ Timeout → Backend spinning up (wait 30-60 seconds on Render free tier)

---

### **Test 3: Login Flow**
1. Open your Vercel frontend
2. Open DevTools → Console tab
3. Try to login
4. Check for errors

**Common Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `NetworkError when attempting to fetch` | CORS blocking | Check ALLOWED_ORIGINS in Render |
| `Failed to fetch` | Wrong API URL | Check VITE_API_URL in Vercel |
| `Request timed out after 15 seconds` | Render cold start | Wait and retry |
| `Too many authentication attempts` | Rate limiting | Wait 15 minutes or set DISABLE_RATE_LIMIT=true |

---

## 🔍 How to Find Your URLs

### Find Your Render Backend URL:
1. Go to Render Dashboard
2. Click on your backend service
3. Copy the URL at the top (e.g., `https://gts-dashboard-api.onrender.com`)
4. Add `/api` at the end for VITE_API_URL

### Find Your Vercel Frontend URL:
1. Go to Vercel Dashboard
2. Click on your frontend project
3. Click "Visit" or copy the URL shown
4. Use this for ALLOWED_ORIGINS and APP_URL

---

## ⚠️ Common Mistakes

### ❌ **Mistake 1: Using localhost in production**
```bash
# WRONG:
VITE_API_URL=http://localhost:5000/api

# CORRECT:
VITE_API_URL=https://your-backend.onrender.com/api
```

### ❌ **Mistake 2: Forgetting /api in VITE_API_URL**
```bash
# WRONG:
VITE_API_URL=https://your-backend.onrender.com

# CORRECT:
VITE_API_URL=https://your-backend.onrender.com/api
```

### ❌ **Mistake 3: Not redeploying after env changes**
Environment variables only take effect AFTER redeploying!

### ❌ **Mistake 4: Using Gmail on Render**
```bash
# WRONG (blocked on Render free tier):
EMAIL_SERVICE=gmail

# CORRECT:
EMAIL_SERVICE=
EMAIL_HOST=smtp-relay.brevo.com
```

---

## 🐛 Debugging Steps

### If login still fails:

**1. Check Render Logs:**
```
Render Dashboard → Your Service → Logs tab
```
Look for:
- CORS errors
- Database connection errors
- Port binding errors

**2. Check Vercel Logs:**
```
Vercel Dashboard → Your Project → Deployments → Latest → View Function Logs
```
Look for:
- Build errors
- Environment variable issues

**3. Check Browser Console:**
```
F12 → Console tab
```
Look for:
- Network errors
- CORS errors
- Failed API calls

**4. Test API Directly:**
Use curl or Postman:
```bash
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📋 Checklist

Before asking for help, verify:

- [ ] ALLOWED_ORIGINS includes your Vercel URL
- [ ] VITE_API_URL points to Render backend (with /api)
- [ ] APP_URL points to Vercel frontend
- [ ] Both services redeployed after env changes
- [ ] Backend health check returns 200 OK
- [ ] EMAIL_SERVICE is empty (not "gmail")
- [ ] MONGODB_URI is correct
- [ ] JWT_SECRET is set (minimum 32 characters)
- [ ] All VAPID keys are set and match

---

## 🎯 Quick Reference

**What was working on Oct 21?**
The app was working before recent email service changes. The issue is likely:
1. ALLOWED_ORIGINS not updated for new Vercel URL
2. Or Vercel frontend missing VITE_API_URL
3. Or render.yaml had EMAIL_SERVICE=gmail which blocks email (but shouldn't affect login)

**Why did it stop working?**
Possible reasons:
- Vercel URL changed after redeployment
- Environment variables were accidentally deleted/changed
- Render service was recreated without env vars
- ALLOWED_ORIGINS wasn't set initially (worked locally, broke in production)

---

## 🆘 Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Share these details:**
   - Your Render backend URL
   - Your Vercel frontend URL
   - Console errors from browser DevTools
   - Render logs (last 50 lines)

2. **Temporary debugging:**
   Add this to Render env vars:
   ```
   DISABLE_RATE_LIMIT=true
   ```
   This will help rule out rate limiting issues.

3. **Nuclear option:**
   Set in Render:
   ```
   ALLOWED_ORIGINS=*
   ```
   ⚠️ This allows ALL origins (insecure) but will confirm if CORS is the issue.
   Don't leave this in production!

---

**Last Updated:** 2024-10-26
**Author:** Claude Code
