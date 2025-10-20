const webpush = require('web-push');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const PushSubscription = require('../models/PushSubscription');
const Vehicle = require('../models/Vehicle');
const HomeRent = require('../models/HomeRent');
const Electricity = require('../models/Electricity');

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Configure Email (optional) - Support both SMTP and Resend API
let transporter = null;
let resendClient = null;
const isEmailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

if (isEmailConfigured) {
  try {
    console.log('📧 Initializing email transporter...');
    console.log('   Service:', process.env.EMAIL_SERVICE);
    console.log('   User:', process.env.EMAIL_USER);
    console.log('   Pass configured:', process.env.EMAIL_PASS ? 'Yes' : 'No');

    transporter = nodemailer.createTransport({
      // Prefer well-known service if provided, else allow host/port configuration
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
      secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : undefined,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add connection pooling and timeouts - longer for production
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      rateDelta: 1000,
      rateLimit: 5,
      // Longer timeouts for production environments
      connectionTimeout: 60000, // 60 seconds (production can be slower)
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // Add debug mode in development
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });

    transporter.verify((error) => {
      if (error) {
        console.error('❌ Email configuration error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Command:', error.command);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  } catch (err) {
    console.error('❌ Failed to initialize email transporter:', err.message);
  }
} else {
  console.log('ℹ️ SMTP Email not configured.');
}

// Configure Resend API (fallback for environments that block SMTP)
if (isResendConfigured) {
  try {
    console.log('📧 Initializing Resend API client...');
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend API client initialized');
  } catch (err) {
    console.error('❌ Failed to initialize Resend client:', err.message);
  }
} else {
  console.log('ℹ️ Resend API not configured.');
}

if (!isEmailConfigured && !isResendConfigured) {
  console.log('⚠️ No email service configured. Set either EMAIL_USER/EMAIL_PASS or RESEND_API_KEY to enable email notifications.');
}

class NotificationService {
  // Calculate days until expiration
  getDaysUntilExpiration(dateString) {
    if (!dateString) return null;
    const expiryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if item needs notification
  shouldNotify(daysUntil) {
    if (daysUntil === null) return false;

    const threshold = parseInt(process.env.NOTIFICATION_DAYS_BEFORE) || 10;

    // Send notifications from threshold days before and continue indefinitely (even if expired)
    return daysUntil <= threshold;
  }

  // Get all items that need notifications
  async getItemsNeedingNotification() {
    const notifications = [];

    try {
      // Check Vehicles
      const vehicles = await Vehicle.find({});
      for (const vehicle of vehicles) {
        const licenseDays = this.getDaysUntilExpiration(vehicle.licenseExpiryDate);
        const inspectionDays = this.getDaysUntilExpiration(vehicle.inspectionExpiryDate);
        const insuranceDays = this.getDaysUntilExpiration(vehicle.insuranceExpiryDate);

        // License notification
        if (this.shouldNotify(licenseDays) && vehicle.licenseExpiryDate) {
          const status = licenseDays < 0
            ? `Expired ${Math.abs(licenseDays)} days ago`
            : licenseDays === 0
              ? 'Expires Today'
              : `${licenseDays} days remaining`;

          notifications.push({
            type: 'vehicle',
            subType: 'license',
            item: vehicle,
            itemId: vehicle._id,
            fieldName: 'licenseExpiryDate',
            expiryDate: vehicle.licenseExpiryDate,
            daysUntil: licenseDays,
            title: licenseDays < 0 ? '❌ Vehicle License EXPIRED' : '🚗 Vehicle License Expiring Soon',
            message: `Vehicle ${vehicle.plateNumber} license - ${status} (${new Date(vehicle.licenseExpiryDate).toLocaleDateString()})`
          });
        }

        // Inspection notification
        if (this.shouldNotify(inspectionDays) && vehicle.inspectionExpiryDate) {
          const status = inspectionDays < 0
            ? `Expired ${Math.abs(inspectionDays)} days ago`
            : inspectionDays === 0
              ? 'Expires Today'
              : `${inspectionDays} days remaining`;

          notifications.push({
            type: 'vehicle',
            subType: 'inspection',
            item: vehicle,
            itemId: vehicle._id,
            fieldName: 'inspectionExpiryDate',
            expiryDate: vehicle.inspectionExpiryDate,
            daysUntil: inspectionDays,
            title: inspectionDays < 0 ? '❌ Vehicle Inspection EXPIRED' : '🔧 Vehicle Inspection Due',
            message: `Vehicle ${vehicle.plateNumber} inspection - ${status} (${new Date(vehicle.inspectionExpiryDate).toLocaleDateString()})`
          });
        }

        // Insurance notification
        if (this.shouldNotify(insuranceDays) && vehicle.insuranceExpiryDate) {
          const status = insuranceDays < 0
            ? `Expired ${Math.abs(insuranceDays)} days ago`
            : insuranceDays === 0
              ? 'Expires Today'
              : `${insuranceDays} days remaining`;

          notifications.push({
            type: 'vehicle',
            subType: 'insurance',
            item: vehicle,
            itemId: vehicle._id,
            fieldName: 'insuranceExpiryDate',
            expiryDate: vehicle.insuranceExpiryDate,
            daysUntil: insuranceDays,
            title: insuranceDays < 0 ? '❌ Vehicle Insurance EXPIRED' : '🛡️ Vehicle Insurance Expiring Soon',
            message: `Vehicle ${vehicle.plateNumber} insurance - ${status} (${new Date(vehicle.insuranceExpiryDate).toLocaleDateString()})${vehicle.insuranceCompany ? ' - ' + vehicle.insuranceCompany : ''}`
          });
        }
      }

      // Check Home Rents - Only check contract ending date
      const homeRents = await HomeRent.find({});
      for (const rent of homeRents) {
        const contractDays = this.getDaysUntilExpiration(rent.contractEndingDate);

        // Contract expiry notification (only based on contract ending date)
        if (this.shouldNotify(contractDays) && rent.contractEndingDate) {
          const status = contractDays < 0
            ? `Expired ${Math.abs(contractDays)} days ago`
            : contractDays === 0
              ? 'Expires Today'
              : `${contractDays} days remaining`;

          notifications.push({
            type: 'homeRent',
            subType: 'contract',
            item: rent,
            itemId: rent._id,
            fieldName: 'contractEndingDate',
            expiryDate: rent.contractEndingDate,
            daysUntil: contractDays,
            title: contractDays < 0 ? '❌ Rental Contract EXPIRED' : '🏠 Rental Contract Expiring',
            message: `Contract ${rent.contractNumber} - ${status} (${new Date(rent.contractEndingDate).toLocaleDateString()})`
          });
        }
      }

      // Check Electricity Bills (only unpaid bills)
      const bills = await Electricity.find({ paymentStatus: { $ne: 'Paid' } });
      for (const bill of bills) {
        const dueDays = this.getDaysUntilExpiration(bill.dueDate);

        if (this.shouldNotify(dueDays) && bill.dueDate) {
          const status = dueDays < 0
            ? `Overdue ${Math.abs(dueDays)} days`
            : dueDays === 0
              ? 'Due Today'
              : `${dueDays} days remaining`;

          notifications.push({
            type: 'electricity',
            subType: 'payment',
            item: bill,
            itemId: bill._id,
            fieldName: 'dueDate',
            expiryDate: bill.dueDate,
            daysUntil: dueDays,
            title: dueDays < 0 ? '❌ Electricity Bill OVERDUE' : '⚡ Electricity Bill Due',
            message: `Bill for ${bill.location} (meter ${bill.meterNumber}) - ${status} - SAR ${bill.billAmount} (${new Date(bill.dueDate).toLocaleDateString()})`
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error getting items needing notification:', error);
      return [];
    }
  }

  // Send push notification to all subscribers
  async sendPushNotification(notification) {
    try {
      const subscriptions = await PushSubscription.find({});
      console.log(`📤 Found ${subscriptions.length} push subscription(s)`);

      if (subscriptions.length === 0) {
        console.log('⚠️ No push subscriptions found - nobody subscribed yet');
        return { success: true, sent: 0, total: 0 };
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        tag: `gts-${notification.type}-${Date.now()}`,
        data: {
          type: notification.type,
          subType: notification.subType,
          daysUntil: notification.daysUntil,
          url: '/'
        }
      });

      console.log(`📨 Sending notification: ${notification.title}`);

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            console.log(`  → Sending to: ${sub.userEmail} (${sub.endpoint.substring(0, 50)}...)`);

            const response = await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys
              },
              payload
            );

            console.log(`  ✅ Sent successfully to ${sub.userEmail}`);

            // Update lastUsed
            sub.lastUsed = new Date();
            await sub.save();

            return { success: true, endpoint: sub.endpoint, response };
          } catch (error) {
            console.error(`  ❌ Failed to send to ${sub.userEmail}:`, error.message);
            console.error(`     Status: ${error.statusCode}, Body: ${error.body}`);

            // If subscription is invalid, delete it
            if (error.statusCode === 410 || error.statusCode === 404) {
              await PushSubscription.deleteOne({ _id: sub._id });
              console.log(`  🗑️ Removed invalid subscription for ${sub.userEmail}`);
            }
            throw error;
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Push notifications: ${successful} sent, ${failed} failed (total: ${subscriptions.length})`);

      return { success: true, sent: successful, failed, total: subscriptions.length };
    } catch (error) {
      console.error('❌ Error in sendPushNotification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmailNotification(notification, emails) {
    try {
      if (!transporter) {
        return { success: false, skipped: true, reason: 'Email not configured' };
      }

      // Generate proper status message
      const statusMessage = notification.daysUntil < 0
        ? `<strong style="color: #dc2626;">Status:</strong> Expired ${Math.abs(notification.daysUntil)} days ago`
        : notification.daysUntil === 0
          ? `<strong style="color: #ea580c;">Status:</strong> Expires Today`
          : `<strong style="color: #f59e0b;">Days Remaining:</strong> ${notification.daysUntil} days`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .alert-expired { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GTS Dashboard Alert</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <div class="${notification.daysUntil < 0 ? 'alert-expired' : 'alert'}">
                <strong>${notification.daysUntil < 0 ? '❌' : '⚠️'} Expiration Alert</strong><br>
                ${notification.message}
              </div>
              <p>${statusMessage}</p>
              <p><strong>Type:</strong> ${notification.type}</p>
              <p>${notification.daysUntil < 0 ? 'This item is overdue! Please take immediate action.' : 'Please take necessary action before the expiration date.'}</p>
              <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="button">
                View Dashboard
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from GTS Dashboard</p>
              <p>Do not reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: emails.join(', '),
        subject: notification.title,
        html: htmlContent,
        text: notification.message
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send grouped email notifications (all items of same type in one email)
  async sendGroupedEmailNotification(notifications, type, emails) {
    try {
      if (!transporter) {
        return { success: false, skipped: true, reason: 'Email not configured' };
      }

      const typeTitles = {
        vehicle: '🚗 Vehicle Alerts',
        homeRent: '🏠 Home Rent Alerts',
        electricity: '⚡ Electricity Bill Alerts'
      };
      const typeTitle = typeTitles[type] || 'Alerts';

      // Generate alert items HTML
      const alertItems = notifications.map(notif => {
        const statusText = notif.daysUntil < 0
          ? `Expired ${Math.abs(notif.daysUntil)} days ago`
          : notif.daysUntil === 0
            ? 'Expires Today'
            : `${notif.daysUntil} days remaining`;

        const alertClass = notif.daysUntil < 0 ? 'alert-expired' : 'alert';

        return `
        <div class="${alertClass}">
          <strong>${notif.title}</strong><br>
          ${notif.message}<br>
          <small><strong>Status:</strong> ${statusText}</small>
        </div>
      `;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .alert-expired { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GTS Dashboard Alert</h1>
            </div>
            <div class="content">
              <h2>${typeTitle}</h2>
              <p>You have ${notifications.length} alert(s) requiring attention:</p>
              ${alertItems}
              <p>Please take necessary action before the expiration dates.</p>
              <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="button">
                View Dashboard
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from GTS Dashboard</p>
              <p>Do not reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: emails.join(', '),
        subject: typeTitle,
        html: htmlContent,
        text: notifications.map(n => n.message).join('\n\n')
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Grouped ${type} email sent:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Error sending grouped ${type} email:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send all notifications (push + email) - SEPARATED
  async sendAllNotifications() {
    console.log('\n🔔 Checking for items needing notifications...');
    console.log(`📅 Current date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Notification threshold: ${process.env.NOTIFICATION_DAYS_BEFORE || 10} days before expiration`);

    const notifications = await this.getItemsNeedingNotification();

    if (notifications.length === 0) {
      console.log('✅ No notifications needed at this time');
      return { total: 0, sent: 0, push: 0, email: 0 };
    }

    console.log(`📨 Found ${notifications.length} items needing notification:`);

    // Log each notification item
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.daysUntil} days remaining`);
    });

    // Group notifications by type (for emails)
    const groupedNotifications = {
      vehicle: notifications.filter(n => n.type === 'vehicle'),
      homeRent: notifications.filter(n => n.type === 'homeRent'),
      electricity: notifications.filter(n => n.type === 'electricity')
    };

    let pushSent = 0;
    let emailSent = 0;

    // ========== PUSH NOTIFICATIONS (Browser notifications ONLY) ==========
    console.log('\n📱 Sending Windows Push Notifications...');
    for (const notification of notifications) {
      console.log(`\n📤 Processing push: ${notification.title} (${notification.daysUntil} days until expiration)`);
      console.log(`   📝 Message: ${notification.message}`);
      const pushResult = await this.sendPushNotification(notification);
      if (pushResult.success) {
        pushSent++;
      }
    }

    // ========== EMAIL NOTIFICATIONS (Uses same PushSubscription data) ==========
    // Get unique emails from PushSubscription collection
    const pushSubscriptions = await PushSubscription.find({});
    const uniqueEmails = [...new Set(pushSubscriptions.map(sub => sub.userEmail))];

    if (uniqueEmails.length > 0) {
      console.log(`\n📧 Sending Email Notifications to ${uniqueEmails.length} email address(es)...`);

      // Send grouped emails by type
      if (groupedNotifications.vehicle.length > 0) {
        console.log(`\n📧 Sending grouped vehicle email (${groupedNotifications.vehicle.length} items)`);
        const result = await this.sendGroupedEmailNotification(groupedNotifications.vehicle, 'vehicle', uniqueEmails);
        if (result.success) emailSent++;
      }

      if (groupedNotifications.homeRent.length > 0) {
        console.log(`\n📧 Sending grouped home rent email (${groupedNotifications.homeRent.length} items)`);
        const result = await this.sendGroupedEmailNotification(groupedNotifications.homeRent, 'homeRent', uniqueEmails);
        if (result.success) emailSent++;
      }

      if (groupedNotifications.electricity.length > 0) {
        console.log(`\n📧 Sending grouped electricity email (${groupedNotifications.electricity.length} items)`);
        const result = await this.sendGroupedEmailNotification(groupedNotifications.electricity, 'electricity', uniqueEmails);
        if (result.success) emailSent++;
      }
    } else {
      console.log('\nℹ️ No email subscribers found (no push subscriptions with emails)');
    }

    console.log(`\n✅ Daily notification check complete:`);
    console.log(`   📱 Push notifications: ${pushSent} sent`);
    console.log(`   📧 Email notifications: ${emailSent} sent`);
    console.log(`📆 Next check: Tomorrow at 9:00 AM\n`);
    return { total: notifications.length, sent: pushSent + emailSent, push: pushSent, email: emailSent };
  }

  // Helper method to send email via Resend API
  async sendViaResend(email, subject, htmlContent, textContent) {
    if (!resendClient) {
      throw new Error('Resend API is not configured');
    }

    try {
      console.log('📧 Sending via Resend API to:', email);
      const startTime = Date.now();

      const result = await resendClient.emails.send({
        from: 'GTS Dashboard <onboarding@resend.dev>', // Resend test domain
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Email sent via Resend in ${duration}ms`);
      console.log('   Full Resend response:', JSON.stringify(result));
      console.log('   Email ID:', result.id || result.data?.id);

      // Resend returns either { id: '...' } or { data: { id: '...' } }
      const emailId = result.id || result.data?.id || 'unknown';

      return { success: true, message: 'Test email sent successfully via Resend API', emailId, duration, method: 'Resend API' };
    } catch (error) {
      console.error('❌ Resend API failed:', error);
      console.error('   Error message:', error.message);
      console.error('   Error name:', error.name);
      throw error;
    }
  }

  // Manual trigger for testing (email only) - Try SMTP first, fallback to Resend
  async sendTestNotification(email) {
    const appUrl = process.env.APP_URL || 'https://gts-fullstack.vercel.app';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .test-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin: 10px 0; }
          .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #3b82f6; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; transition: all 0.3s; }
          .button:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
          .checkmark { font-size: 48px; color: #10b981; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 GTS Dashboard</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Test Notification System</p>
          </div>
          <div class="content">
            <div class="checkmark">✅</div>
            <h2 style="text-align: center; color: #1f2937;">Email Notification Test Successful!</h2>

            <span class="test-badge">🧪 TEST MODE</span>

            <div class="info-box">
              <p style="margin: 0;"><strong>📬 Great news!</strong></p>
              <p style="margin: 10px 0 0 0;">Your email notification system is configured correctly and working perfectly. You will receive daily notifications about:</p>
              <ul style="margin: 10px 0;">
                <li>🚗 Vehicle licenses, inspections & insurance expiring soon</li>
                <li>🏠 Home rental contracts ending</li>
                <li>⚡ Electricity bills due for payment</li>
              </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}" class="button">
                🚀 Open GTS Dashboard
              </a>
            </p>

            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Dashboard URL: <a href="${appUrl}" style="color: #3b82f6;">${appUrl}</a>
            </p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>⏰ Notification Schedule:</strong><br>
              Daily automatic checks at 9:00 AM, starting 10 days before expiration dates.
            </div>
          </div>
          <div class="footer">
            <p><strong>GTS Dashboard - German Technical Services Co.</strong></p>
            <p>This is an automated test email from your notification system</p>
            <p style="color: #9ca3af; margin-top: 10px;">Do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = '🧪 Test Email - GTS Dashboard Notification System';
    const textContent = `Test Email Notification\n\nThis is a test email from GTS Dashboard.\n\nYour notification system is working correctly!\n\nDashboard: ${appUrl}`;

    // Try SMTP first (if configured)
    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'GTS Dashboard <noreply@gts-dashboard.com>',
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent
      };

      try {
        // Add timeout wrapper - 30 seconds for faster failover to Resend
        const sendWithTimeout = (mailOptions, timeout = 30000) => {
          return Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('SMTP timeout after 30 seconds')), timeout)
            )
          ]);
        };

        console.log('📧 Trying SMTP first...');
        console.log('   Using SMTP:', process.env.EMAIL_SERVICE, 'with user:', process.env.EMAIL_USER);

        const startTime = Date.now();
        const info = await sendWithTimeout(mailOptions);
        const duration = Date.now() - startTime;

        console.log(`✅ Test email sent successfully via SMTP in ${duration}ms`);
        console.log('   Message ID:', info.messageId);
        console.log('   Method: Gmail SMTP');
        return { success: true, message: 'Test email sent successfully via Gmail SMTP', messageId: info.messageId, duration, method: 'Gmail SMTP' };
      } catch (smtpError) {
        console.warn('⚠️ SMTP failed:', smtpError.code || smtpError.message);
        console.log('🔄 Falling back to Resend API...');

        // If SMTP fails and Resend is configured, try Resend
        if (resendClient) {
          try {
            return await this.sendViaResend(email, subject, htmlContent, textContent);
          } catch (resendError) {
            console.error('❌ Both SMTP and Resend failed');
            throw new Error(`Email sending failed. SMTP error: ${smtpError.message}. Resend error: ${resendError.message}`);
          }
        }

        // No Resend configured, throw SMTP error with helpful message
        if (smtpError.code === 'ETIMEDOUT' || smtpError.code === 'ESOCKET') {
          throw new Error('Gmail SMTP is blocked on this server (Render Free tier blocks SMTP). Please configure RESEND_API_KEY in environment variables. Get your API key at: https://resend.com');
        }

        throw new Error(`SMTP failed: ${smtpError.message}. Consider using Resend API for production.`);
      }
    }

    // No SMTP configured, try Resend
    if (resendClient) {
      console.log('📧 SMTP not configured, using Resend API...');
      return await this.sendViaResend(email, subject, htmlContent, textContent);
    }

    // Neither SMTP nor Resend configured
    throw new Error('No email service configured. Please set either EMAIL_USER/EMAIL_PASS (Gmail SMTP) or RESEND_API_KEY (Resend API) in environment variables.');
  }

  // Manual trigger for testing push notifications (no email)
  async sendTestPushNotification() {
    const testNotification = {
      title: '🧪 Test Push Notification',
      message: 'This is a test Windows push notification from GTS Dashboard',
      type: 'test',
      subType: 'test',
      daysUntil: 10
    };

    await this.sendPushNotification(testNotification);

    return { success: true, message: 'Test push notification sent' };
  }
}

module.exports = new NotificationService();