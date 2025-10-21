# GTS Dashboard - Vercel Deployment Guide

## Overview
- **Frontend**: Vercel (Free tier)
- **Backend**: Vercel (Free tier)
- **Database**: MongoDB Atlas (Existing)
- **Email**: Gmail SMTP (Works on Vercel - no port blocking)

---

## 1. Deploy Backend to Vercel

### Prerequisites
- GitHub account with your repository
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas connection string
- Gmail App Password

### Steps

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare backend for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project Settings**
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

4. **Add Environment Variables**

   Click "Environment Variables" and add all variables from `backend/.env.example`:

   ```bash
   # Server
   PORT=5000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app

   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # VAPID (Push Notifications)
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_EMAIL=mailto:your-email@example.com

   # Email (Gmail SMTP)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   EMAIL_FROM=your-email@gmail.com

   # App
   APP_URL=https://your-frontend-url.vercel.app
   NOTIFICATION_DAYS_BEFORE=10
   NOTIFICATION_CHECK_HOUR=9

   # Absher API (Optional)
   TAMM_API_URL=https://api.elm.sa
   TAMM_AUTH_URL=https://idp.elm.sa/auth/realms/Tamm/protocol/openid-connect/token
   TAMM_REALM_NAME=Tamm
   TAMM_CLIENT_ID=your-client-id
   TAMM_CLIENT_SECRET=your-client-secret
   TAMM_CUSTOMER_ID=your-customer-id
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (1-3 minutes)
   - Copy your backend URL (e.g., `https://gts-dashboard-backend.vercel.app`)

---

## 2. Deploy Frontend to Vercel

### Steps

1. **Import Frontend Project**
   - In Vercel dashboard, click "Add New" → "Project"
   - Select the same GitHub repository
   - Choose to deploy it again (for frontend)

2. **Configure Project Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Add Environment Variable**

   Add only ONE environment variable:

   ```bash
   VITE_API_URL=https://gts-dashboard-backend.vercel.app/api
   ```

   ⚠️ **Important**: Replace with your actual backend URL from step 1

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://gts-dashboard.vercel.app`)

---

## 3. Update CORS Settings

1. **Go to Backend Project in Vercel**
   - Vercel Dashboard → Your backend project
   - Go to "Settings" → "Environment Variables"

2. **Update ALLOWED_ORIGINS**
   - Find `ALLOWED_ORIGINS` variable
   - Update value to your frontend URL:
     ```
     https://gts-dashboard.vercel.app
     ```
   - Save changes

3. **Redeploy Backend**
   - Go to "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"

---

## 4. Update Frontend API URL (if needed)

If you deployed backend first and didn't have the URL:

1. **Go to Frontend Project in Vercel**
   - Vercel Dashboard → Your frontend project
   - Go to "Settings" → "Environment Variables"

2. **Update VITE_API_URL**
   - Update value to your backend URL:
     ```
     https://gts-dashboard-backend.vercel.app/api
     ```
   - Save changes

3. **Redeploy Frontend**
   - Go to "Deployments" tab
   - Click "Redeploy"

---

## 5. Test Your Deployment

### Test Backend API

1. Open your backend URL in browser:
   ```
   https://gts-dashboard-backend.vercel.app/api/health
   ```

2. You should see:
   ```json
   {
     "status": "ok",
     "mongodb": "connected",
     "timestamp": "2025-10-21T...",
     "routes": { ... }
   }
   ```

### Test Frontend Application

1. Open your frontend URL:
   ```
   https://gts-dashboard.vercel.app
   ```

2. Test login with your credentials

3. Test all features:
   - ✅ Vehicles management
   - ✅ Home Rents management
   - ✅ Electricity management
   - ✅ Push notifications (browser)
   - ✅ Email notifications
   - ✅ Settings

### Test Email Notifications

1. Go to Settings page
2. Enable email notifications
3. Click "Send Test Notification"
4. Check both:
   - Browser push notification (should work immediately)
   - Email (check your inbox/spam folder)

---

## 6. Troubleshooting

### Backend Issues

**Check Logs**:
- Vercel Dashboard → Backend Project → Deployments
- Click on latest deployment → "View Function Logs"

**Common Issues**:

1. **MongoDB Connection Failed**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)

2. **Missing Environment Variables**
   - Backend logs will show which variables are missing
   - Add them in Settings → Environment Variables
   - Redeploy

3. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` matches your frontend URL
   - Make sure there are no trailing slashes
   - Redeploy backend after changes

### Frontend Issues

**Check Logs**:
- Vercel Dashboard → Frontend Project → Deployments
- Click on latest deployment → "View Build Logs"

**Common Issues**:

1. **API Connection Failed**
   - Open browser console (F12)
   - Check if `VITE_API_URL` is correct
   - Verify backend is deployed and running
   - Check for CORS errors

2. **Build Failed**
   - Check build logs for errors
   - Verify `package.json` has all dependencies
   - Make sure Node version is compatible (18.x)

### Email Issues

**Gmail SMTP Not Working**:

1. Verify Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a new 16-character password
   - Update `EMAIL_PASS` in backend environment variables
   - Redeploy backend

2. Check Backend Logs:
   - Look for email sending attempts
   - Check for timeout or authentication errors

3. Test SMTP Connection:
   - Use Settings → Send Test Notification
   - Check both browser and email delivery

---

## 7. Automatic Deployments

### How it Works

Vercel automatically deploys when you push to GitHub:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Vercel Auto-Deploys**:
   - Detects changes in `backend/` → redeploys backend
   - Detects changes in `frontend/` → redeploys frontend
   - You'll receive email notifications about deployment status

3. **View Deployments**:
   - Vercel Dashboard → Your Project → Deployments
   - See deployment history, logs, and status

---

## 8. Important Notes

### Free Tier Limitations

**Vercel Free Tier**:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions supported
- ✅ Automatic HTTPS
- ✅ No SMTP port blocking (Gmail SMTP works!)
- ⚠️ Function execution timeout: 10 seconds (hobby plan)
- ⚠️ Cold starts: ~1-2 seconds for inactive functions

### Security

1. **Never commit `.env` files**:
   - `.env` is in `.gitignore`
   - Only commit `.env.example`

2. **Rotate Secrets Regularly**:
   - Change `JWT_SECRET` periodically
   - Regenerate VAPID keys if compromised
   - Update Gmail App Password if needed

3. **Monitor Access**:
   - Check Vercel analytics for unusual traffic
   - Review MongoDB Atlas access logs

### Performance

1. **Database Connection**:
   - Vercel serverless functions create new DB connections
   - MongoDB Atlas handles connection pooling automatically

2. **Notification Scheduler**:
   - Runs on Vercel serverless (triggered by requests)
   - Consider using Vercel Cron Jobs for scheduled tasks (Pro plan)
   - Alternative: Use external cron service (cron-job.org) to ping health endpoint

---

## 9. Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Frontend URL matches ALLOWED_ORIGINS
- [ ] Backend URL matches VITE_API_URL
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0
- [ ] Gmail App Password is valid
- [ ] VAPID keys match on frontend and backend
- [ ] Test login works
- [ ] Test all CRUD operations (Vehicles, Home Rents, Electricity)
- [ ] Test push notifications
- [ ] Test email notifications
- [ ] Check both projects in Vercel dashboard show "Ready"
- [ ] Test on mobile devices

---

## 10. Support & Resources

**Vercel Documentation**:
- https://vercel.com/docs
- https://vercel.com/docs/functions/serverless-functions

**MongoDB Atlas**:
- https://cloud.mongodb.com

**Gmail App Passwords**:
- https://myaccount.google.com/apppasswords

**Need Help?**:
- Check Vercel function logs
- Check browser console (F12)
- Review deployment logs
- Contact support if needed

---

## Final URLs

After deployment, you'll have:

```
Frontend: https://your-project-name.vercel.app
Backend:  https://your-backend-name.vercel.app
Health:   https://your-backend-name.vercel.app/api/health
```

🎉 **Deployment Complete!** Your GTS Dashboard is now live on Vercel with Gmail SMTP email support.
