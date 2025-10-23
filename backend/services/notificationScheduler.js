const cron = require('node-cron');
const notificationService = require('./notificationService');

/**
 * ⚠️ IMPORTANT: This scheduler only works on traditional servers (NOT Vercel)!
 *
 * For Vercel deployment:
 * - Use Vercel Cron Jobs (vercel.json configuration)
 * - OR use external cron service (cron-job.org) to call /api/notifications/cron/daily-check
 *
 * See VERCEL_CRON_SETUP.md for detailed instructions.
 */
class NotificationScheduler {
  start() {
    // Run daily at 9 AM (adjust NOTIFICATION_CHECK_HOUR in .env)
    const hour = process.env.NOTIFICATION_CHECK_HOUR || 9;
    const cronExpression = `0 ${hour} * * *`;

    // Check if running on Vercel
    const isVercel = process.env.VERCEL === '1';
    const isRender = process.env.RENDER === 'true';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 NOTIFICATION SCHEDULER ACTIVATED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏰ Schedule: Daily at ${hour}:00 (server timezone)`);
    console.log(`🌍 Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`📧 Notifications: Email + Windows Push`);
    console.log(`📆 Frequency: Every day from 10 days before until expiration`);

    if (isVercel) {
      console.log(`\n⚠️  NOTE: Running on Vercel - node-cron won't work!`);
      console.log(`   Use Vercel Cron Jobs or cron-job.org instead.`);
      console.log(`   See VERCEL_CRON_SETUP.md for setup instructions.`);
    }

    if (isRender) {
      console.log(`\n✅ Running on Render - node-cron will work!`);
      console.log(`   ⚠️  Note: On Free tier, service sleeps after 15 min of inactivity`);
      console.log(`   Use UptimeRobot or upgrade to keep service alive 24/7`);
    }

    console.log(`${'='.repeat(60)}\n`);

    // Schedule daily check
    cron.schedule(cronExpression, async () => {
      console.log('\n⏰ ========== SCHEDULED NOTIFICATION CHECK ==========');
      console.log(`Time: ${new Date().toLocaleString()}`);
      try {
        await notificationService.sendAllNotifications();
      } catch (error) {
        console.error('❌ Error in scheduled notification check:', error);
      }
      console.log('========== NOTIFICATION CHECK COMPLETE ==========\n');
    });

    // Optional: Run immediately on startup (for testing)
    // Disabled to reduce console noise - uncomment if needed
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🧪 DEV MODE: Running initial notification check in 5 seconds...\n');
    //   setTimeout(() => {
    //     notificationService.sendAllNotifications();
    //   }, 5000);
    // }
  }
}

module.exports = new NotificationScheduler();