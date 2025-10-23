# 🕒 Vercel Cron Jobs Setup for Daily Notifications

## Why Vercel Cron Jobs?

**Traditional `node-cron` doesn't work on Vercel Serverless!**

Vercel functions are **stateless** and **on-demand only**. They spin up on requests and die after completion. This means:
- ❌ `node-cron` won't stay running
- ❌ Background jobs don't work
- ✅ You need **Vercel Cron Jobs** instead!

---

## ✅ Setup Instructions

### 1️⃣ Deploy to Vercel

First, make sure your project is deployed to Vercel:

```bash
vercel --prod
```

### 2️⃣ Verify Cron Configuration

The `vercel.json` file already contains the cron configuration:

```json
{
  "version": 2,
  "crons": [
    {
      "path": "/api/notifications/cron/daily-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule Format:** `0 9 * * *` = Every day at 9:00 AM UTC

### 3️⃣ Enable Cron Jobs on Vercel Dashboard

⚠️ **IMPORTANT:** Cron jobs are **only available on paid Vercel plans (Pro/Enterprise)**

If you're on the **Free plan**, you have two options:

#### Option A: Upgrade to Vercel Pro ($20/month)
1. Go to your Vercel Dashboard
2. Click on your project
3. Go to Settings → General
4. Upgrade to Pro plan
5. Cron jobs will activate automatically

#### Option B: Use External Cron Service (Free)
Use a free service like **cron-job.org** to call your endpoint:

1. Go to https://cron-job.org
2. Create a free account
3. Create a new cron job:
   - **URL:** `https://your-app.vercel.app/api/notifications/cron/daily-check`
   - **Schedule:** `0 9 * * *` (every day at 9 AM)
   - **Method:** GET
   - **Timeout:** 60 seconds

---

## 🔒 Security (Optional)

To prevent unauthorized access to your cron endpoint, add a secret:

### 1. Add CRON_SECRET to Vercel Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - **Key:** `CRON_SECRET`
   - **Value:** A random secret (e.g., `your-random-secret-here-12345`)

### 2. Update cron-job.org (if using external service)

Add a **Custom Header**:
- **Name:** `Authorization`
- **Value:** `Bearer your-random-secret-here-12345`

---

## 📊 Check if Cron is Working

### View Logs on Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** → Select latest deployment
4. Click **Functions** tab
5. Look for `/api/notifications/cron/daily-check`
6. Check logs for:
   ```
   ⏰ ========== VERCEL CRON: DAILY NOTIFICATION CHECK ==========
   ```

### Manual Test

You can manually trigger the cron job:

```bash
# Without secret
curl https://your-app.vercel.app/api/notifications/cron/daily-check

# With secret
curl -H "Authorization: Bearer your-secret" \
  https://your-app.vercel.app/api/notifications/cron/daily-check
```

Expected response:
```json
{
  "success": true,
  "message": "Daily notification check completed",
  "result": {
    "total": 5,
    "sent": 5,
    "push": 5,
    "email": 1
  }
}
```

---

## 🌍 Timezone Configuration

The cron runs in **UTC timezone** by default.

If you want 9 AM in **Saudi Arabia time (UTC+3)**, use:
```json
"schedule": "0 6 * * *"
```
(6 AM UTC = 9 AM Saudi Arabia)

Or for other timezones:
- **UTC+0 (London):** `0 9 * * *`
- **UTC+3 (Saudi Arabia):** `0 6 * * *`
- **UTC+2 (Egypt):** `0 7 * * *`
- **UTC-5 (New York):** `0 14 * * *`

---

## ⚠️ Troubleshooting

### Problem: No emails received at 9 AM

**Check:**
1. ✅ Vercel Pro plan enabled (or using cron-job.org)
2. ✅ Deployment successful
3. ✅ Environment variables set (EMAIL_USER, EMAIL_PASS, etc.)
4. ✅ Check Vercel function logs
5. ✅ Verify cron endpoint works: `curl https://your-app.vercel.app/api/notifications/cron/daily-check`

### Problem: "Unauthorized" error

- Remove `CRON_SECRET` from environment variables, or
- Add correct `Authorization: Bearer <secret>` header

### Problem: Timeout errors

- Increase function timeout in `vercel.json`:
  ```json
  {
    "functions": {
      "api/notifications/cron/daily-check.js": {
        "maxDuration": 60
      }
    }
  }
  ```

---

## ✅ Quick Start (Recommended)

**For Free Tier Users (Best Option):**

1. Use **cron-job.org** (free service)
2. Set up a job to call your endpoint every day at 9 AM
3. No Vercel Pro subscription needed!

**For Pro Users:**
1. Just deploy - Vercel Cron Jobs work automatically!
2. Monitor logs in Vercel Dashboard

---

## 📝 Summary

| Method | Cost | Setup Time | Reliability |
|--------|------|------------|-------------|
| **Vercel Cron Jobs** | $20/month | 5 minutes | ⭐⭐⭐⭐⭐ |
| **cron-job.org** | Free | 10 minutes | ⭐⭐⭐⭐ |
| **node-cron (local)** | Free | N/A | ❌ Doesn't work on Vercel |

---

## 🎯 Next Steps

1. Choose your cron method (Vercel Pro or cron-job.org)
2. Test the endpoint manually
3. Wait for 9 AM or trigger manually
4. Check email inbox for notifications!

---

**Need help?** Check Vercel Cron Jobs documentation:
https://vercel.com/docs/cron-jobs
