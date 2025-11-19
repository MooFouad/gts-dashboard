const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const notificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

// ========== CRON JOB ENDPOINT ==========
// This endpoint can be called by UptimeRobot or cron-job.org daily at 9 AM
// For Render: Use UptimeRobot to keep service alive and trigger notifications
router.get('/cron/daily-check', async (req, res) => {
  try {
    // Verify request with CRON_SECRET (optional security check)
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('\n⏰ ========== CRON JOB: DAILY NOTIFICATION CHECK ==========');
    console.log(`Time: ${new Date().toLocaleString()}`);

    const result = await notificationService.sendAllNotifications();

    console.log('========== CRON: NOTIFICATION CHECK COMPLETE ==========\n');

    res.json({
      success: true,
      message: 'Daily notification check completed',
      result
    });
  } catch (error) {
    console.error('❌ Error in cron notification check:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, email, notificationTypes } = req.body;

    console.log('📬 Subscription request received from:', email);
    console.log('📋 Notification types:', notificationTypes || 'all (default)');

    if (!subscription || !email) {
      return res.status(400).json({ error: 'Subscription and email are required' });
    }

    // Validate subscription object
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription format' });
    }

    // Validate notificationTypes if provided
    const validTypes = ['vehicle', 'homeRent', 'electricity', 'absher', 'socialInsurance'];
    if (notificationTypes && !Array.isArray(notificationTypes)) {
      return res.status(400).json({ error: 'notificationTypes must be an array' });
    }
    if (notificationTypes && notificationTypes.some(type => !validTypes.includes(type))) {
      return res.status(400).json({ error: 'Invalid notification type. Valid types: vehicle, homeRent, electricity, absher, socialInsurance' });
    }

    // Check if subscription already exists
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

    if (existing) {
      console.log('Updating existing subscription for:', email);
      existing.userEmail = email;
      existing.lastUsed = new Date();
      existing.keys = subscription.keys;
      // Update notificationTypes if provided, otherwise keep existing or use default
      if (notificationTypes) {
        existing.notificationTypes = notificationTypes;
      }
      await existing.save();
      return res.json({
        success: true,
        message: 'Subscription updated',
        id: existing._id,
        notificationTypes: existing.notificationTypes
      });
    }

    // Create new subscription
    const newSubscription = new PushSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userEmail: email,
      notificationTypes: notificationTypes || ['vehicle', 'homeRent', 'electricity', 'absher', 'socialInsurance'],
      userAgent: req.headers['user-agent']
    });

    await newSubscription.save();

    console.log('✅ New push subscription saved for:', email);
    console.log('Subscription ID:', newSubscription._id);
    console.log('Notification types:', newSubscription.notificationTypes);

    res.json({
      success: true,
      message: 'Subscribed to notifications',
      id: newSubscription._id,
      notificationTypes: newSubscription.notificationTypes
    });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const result = await PushSubscription.deleteOne({ endpoint });

    console.log('✅ Subscription removed:', endpoint);
    res.json({ 
      success: true, 
      message: 'Unsubscribed successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('❌ VAPID_PUBLIC_KEY not configured in .env');
    return res.status(500).json({ error: 'VAPID key not configured' });
  }
  
  console.log('✅ Sending VAPID public key');
  res.json({ publicKey });
});

// Manual trigger for testing EMAIL notifications
router.post('/test', authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🧪 Sending test EMAIL to:', email);
    await notificationService.sendTestNotification(email);

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger for testing PUSH notifications (browser only, no email)
router.post('/test-push', authenticate, async (req, res) => {
  try {
    console.log('🧪 Sending test PUSH notification');
    await notificationService.sendTestPushNotification();

    res.json({ success: true, message: 'Test push notification sent to all subscribed browsers' });
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger notification check manually (supports both GET and POST)
router.get('/check-now', authenticate, async (req, res) => {
  try {
    console.log('🔍 Manual notification check triggered (GET)');
    const result = await notificationService.sendAllNotifications();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error checking notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-now', authenticate, async (req, res) => {
  try {
    console.log('🔍 Manual notification check triggered (POST)');
    const result = await notificationService.sendAllNotifications();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error checking notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.post('/update-preferences', authenticate, async (req, res) => {
  try {
    const { email, notificationTypes } = req.body;

    if (!email || !notificationTypes) {
      return res.status(400).json({ error: 'Email and notificationTypes are required' });
    }

    // Validate notificationTypes
    const validTypes = ['vehicle', 'homeRent', 'electricity', 'absher', 'socialInsurance'];
    if (!Array.isArray(notificationTypes)) {
      return res.status(400).json({ error: 'notificationTypes must be an array' });
    }
    if (notificationTypes.some(type => !validTypes.includes(type))) {
      return res.status(400).json({ error: 'Invalid notification type. Valid types: vehicle, homeRent, electricity, absher, socialInsurance' });
    }

    // Update all subscriptions for this email
    const result = await PushSubscription.updateMany(
      { userEmail: email },
      { $set: { notificationTypes: notificationTypes } }
    );

    console.log('✅ Preferences updated for:', email);
    console.log('Updated subscriptions:', result.modifiedCount);

    res.json({
      success: true,
      message: 'Notification preferences updated',
      updatedCount: result.modifiedCount,
      notificationTypes: notificationTypes
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences for a user
router.get('/preferences/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;

    const subscription = await PushSubscription.findOne({ userEmail: email });

    if (!subscription) {
      return res.json({
        success: true,
        notificationTypes: ['vehicle', 'homeRent', 'electricity', 'absher', 'socialInsurance'] // Default
      });
    }

    res.json({
      success: true,
      notificationTypes: subscription.notificationTypes || ['vehicle', 'homeRent', 'electricity', 'absher', 'socialInsurance']
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all subscriptions (for debugging)
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({}).select('-keys').maxTimeMS(5000).exec();
    res.json({
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;