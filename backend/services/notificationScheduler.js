const cron = require('node-cron');
const notificationService = require('./notificationService');
const { runScheduledBackup } = require('../scripts/scheduledBackup');

/**
 * Notification Scheduler for Render
 *
 * Uses node-cron to check and send daily notifications at configured hour.
 *
 * IMPORTANT for Render Free Tier:
 * - Service sleeps after 15 min of inactivity
 * - Use UptimeRobot to keep service alive (ping every 5 min)
 * - See RENDER_SETUP.md for detailed instructions
 */
class NotificationScheduler {
  start() {
    // Run daily at 9 AM (adjust NOTIFICATION_CHECK_HOUR in .env)
    const hour = process.env.NOTIFICATION_CHECK_HOUR || 9;
    const cronExpression = `0 ${hour} * * *`;
    const isRender = process.env.RENDER === 'true';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 NOTIFICATION SCHEDULER ACTIVATED (Render)`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏰ Schedule: Daily at ${hour}:00 (server timezone)`);
    console.log(`🌍 Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`📧 Notifications: Email + Push Notifications`);
    console.log(`📆 Frequency: Every day from 10 days before until expiration`);

    if (isRender) {
      console.log(`\n✅ Running on Render`);
      console.log(`   ⚠️  Free tier: Service sleeps after 15 min of inactivity`);
      console.log(`   💡 Solution: Use UptimeRobot to ping every 5 minutes`);
      console.log(`   📖 See RENDER_SETUP.md for detailed instructions`);
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

    // Schedule daily backup at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('\n💾 ========== SCHEDULED DAILY BACKUP ==========');
      console.log(`Time: ${new Date().toLocaleString()}`);
      try {
        await runScheduledBackup();
      } catch (error) {
        console.error('❌ Error in scheduled backup:', error);
      }
      console.log('========== BACKUP COMPLETE ==========\n');
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