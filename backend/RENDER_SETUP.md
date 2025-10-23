# 🚀 Render Deployment Guide - Daily Notifications

## ✅ Good News!

On **Render**, `node-cron` works perfectly because Render provides **persistent servers** (not serverless like Vercel)!

---

## ⚠️ The Problem: Free Tier Sleeping

### Render Free Tier Limitations:

| Feature | Free Tier | Paid Tier ($7/month) |
|---------|-----------|---------------------|
| **Service Sleep** | After 15 min inactivity | Never sleeps |
| **Wake-up Time** | 30-60 seconds | N/A |
| **Cron Jobs** | ❌ Won't work (service sleeps) | ✅ Works perfectly |
| **RAM** | 512 MB | 512 MB - 8 GB |

### Why Daily Emails Don't Work on Free Tier:

```
9:00 AM → Service is sleeping → Cron doesn't run → No emails! ❌
```

---

## 🎯 Solutions

### Option 1: Upgrade to Render Paid Plan ⭐ ($7/month)

**Best option for production!**

**Steps:**
1. Go to your Render Dashboard
2. Select your service
3. Click **Upgrade** → Select **Starter Plan** ($7/month)
4. **Done!** Service stays alive 24/7, cron runs perfectly

**Benefits:**
- ✅ Service runs 24/7
- ✅ node-cron works automatically
- ✅ No additional setup needed
- ✅ Better performance

---

### Option 2: Keep Service Alive (Free) 🆓

Use **UptimeRobot** to ping your service every 5 minutes:

#### Step 1: Setup Health Check Endpoint

Already added! Your backend has:
```
GET /api/health
```

#### Step 2: Setup UptimeRobot (Free)

1. **Go to:** https://uptimerobot.com
2. **Sign up** for free account
3. **Add New Monitor:**

```
Monitor Type: HTTP(s)
Friendly Name: GTS Backend Keep-Alive
URL: https://your-app.onrender.com/api/health
Monitoring Interval: Every 5 minutes
```

4. **Save** and activate!

**How it works:**
```
Every 5 minutes → UptimeRobot pings /api/health → Service stays awake → Cron runs! ✅
```

**Limitations:**
- Slight delay possible if service sleeps between pings
- Uses your free UptimeRobot quota (50 monitors free)

---

### Option 3: Use External Cron Service 🔄

Use **cron-job.org** to trigger notifications:

1. **Go to:** https://cron-job.org
2. **Create account** (free)
3. **Add New Cron Job:**

```
Title: GTS Daily Notifications
URL: https://your-app.onrender.com/api/notifications/check-now
Schedule: 0 9 * * * (Daily at 9 AM)
Method: POST
Timeout: 60 seconds
```

4. **Save!**

**Benefits:**
- ✅ Works even if service sleeps
- ✅ Guaranteed to run at 9 AM
- ✅ No need to keep service alive

---

## 🌍 Timezone Configuration

Render servers run on **UTC timezone** by default.

### Check Current Timezone:

Look at your Render logs when service starts:
```
🌍 Server Timezone: Etc/UTC
```

### To get 9 AM Saudi Arabia time (UTC+3):

**Option A:** Set in Environment Variables
```
TZ=Asia/Riyadh
NOTIFICATION_CHECK_HOUR=9
```

**Option B:** Adjust hour for UTC
```
NOTIFICATION_CHECK_HOUR=6
```
(6 AM UTC = 9 AM Saudi Arabia)

### Common Timezones:

| Location | TZ Variable | UTC Hour for 9 AM Local |
|----------|-------------|------------------------|
| **Saudi Arabia** | `Asia/Riyadh` | 6 (UTC+3) |
| **Egypt** | `Africa/Cairo` | 7 (UTC+2) |
| **UAE** | `Asia/Dubai` | 5 (UTC+4) |
| **London** | `Europe/London` | 9 (UTC+0) |

---

## 📊 Check if Cron is Working

### 1. Check Render Logs

In Render Dashboard:
1. Go to your service
2. Click **Logs** tab
3. Look for:

```
📅 NOTIFICATION SCHEDULER ACTIVATED
⏰ Schedule: Daily at 9:00 (server timezone)
🌍 Server Timezone: Etc/UTC
✅ Running on Render - node-cron will work!
```

At 9 AM, you should see:
```
⏰ ========== SCHEDULED NOTIFICATION CHECK ==========
Time: ...
```

### 2. Manual Test

You can manually trigger notifications:

```bash
curl -X POST https://your-app.onrender.com/api/notifications/check-now
```

Expected response:
```json
{
  "success": true,
  "result": {
    "total": 5,
    "sent": 5,
    "push": 5,
    "email": 1
  }
}
```

### 3. Check Service Status

Make sure service is **not sleeping**:
```bash
curl https://your-app.onrender.com/api/health
```

Should respond **immediately**. If it takes 30+ seconds, service was sleeping!

---

## 🛠️ Environment Variables on Render

Make sure these are set in Render Dashboard → Environment:

```bash
# Required
MONGODB_URI=mongodb+srv://...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:your-email@gmail.com
JWT_SECRET=your-secret-key

# Optional - Notification Settings
NOTIFICATION_CHECK_HOUR=9
NOTIFICATION_DAYS_BEFORE=10
TZ=Asia/Riyadh

# Optional - Cron Security
CRON_SECRET=your-random-secret
```

---

## 🔍 Troubleshooting

### Problem: No emails at 9 AM

**Check:**
1. ✅ Is service sleeping? (Free tier issue)
2. ✅ Check Render logs at 9 AM
3. ✅ Verify timezone is correct
4. ✅ Test manually: `POST /api/notifications/check-now`
5. ✅ Check environment variables

**Solution:**
- Use UptimeRobot to keep service alive
- OR upgrade to Render Paid plan
- OR use cron-job.org

### Problem: Service keeps sleeping

**Free tier behavior is normal!**

**Solutions:**
1. Setup UptimeRobot (free)
2. Upgrade to Paid plan ($7/month)

### Problem: Wrong timezone

Check logs for:
```
🌍 Server Timezone: Etc/UTC
```

Set `TZ=Asia/Riyadh` in environment variables.

---

## 📝 Recommended Setup

### For Production (Best):
1. ✅ Upgrade to Render Paid Plan ($7/month)
2. ✅ Set `TZ=Asia/Riyadh`
3. ✅ Set `NOTIFICATION_CHECK_HOUR=9`
4. ✅ Done! Works perfectly

### For Free Tier:
1. ✅ Setup UptimeRobot (keeps service alive)
2. ✅ Set timezone in environment
3. ✅ Monitor logs to verify cron runs

### Alternative (Most Reliable):
1. ✅ Use cron-job.org to trigger notifications
2. ✅ No need to keep service alive
3. ✅ Guaranteed execution at 9 AM

---

## 🎯 Quick Start Guide

### Method 1: Paid Plan (Easiest)
```bash
1. Upgrade to Starter Plan in Render Dashboard
2. Add environment variable: TZ=Asia/Riyadh
3. Redeploy
4. Wait for 9 AM → Check email!
```

### Method 2: Free + UptimeRobot
```bash
1. Sign up at uptimerobot.com
2. Add monitor for: https://your-app.onrender.com/api/health
3. Set interval: 5 minutes
4. Add TZ=Asia/Riyadh to Render environment
5. Redeploy
6. Wait for 9 AM → Check email!
```

### Method 3: Free + cron-job.org
```bash
1. Sign up at cron-job.org
2. Add cron job for: https://your-app.onrender.com/api/notifications/check-now
3. Schedule: 0 9 * * *
4. Add TZ=Asia/Riyadh to Render environment
5. Done! Will trigger at 9 AM daily
```

---

## ✅ Comparison

| Method | Cost | Reliability | Setup Time |
|--------|------|-------------|-----------|
| **Render Paid** | $7/mo | ⭐⭐⭐⭐⭐ | 5 min |
| **UptimeRobot** | Free | ⭐⭐⭐⭐ | 10 min |
| **cron-job.org** | Free | ⭐⭐⭐⭐⭐ | 10 min |

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **UptimeRobot:** https://uptimerobot.com
- **cron-job.org:** https://cron-job.org
- **Render Pricing:** https://render.com/pricing

---

**Need help?** Check Render logs first, they show exactly what's happening!
