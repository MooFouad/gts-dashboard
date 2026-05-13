const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  console.log('🔄 Starting scheduled backup...');

  try {
    // Connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
    }

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {};

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      backup[collectionName] = data;
      console.log(`  ✓ ${collectionName}: ${data.length} documents`);
    }

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-mongoose-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup saved: ${backupPath}`);
    console.log(`📊 Collections: ${collections.length}`);

    // Cleanup old backups (keep last 7)
    cleanupOldBackups(7);

    return { backupPath, backup, collections: collections.length };
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function emailBackup(backupPath) {
  const backupEmail = process.env.BACKUP_EMAIL;
  if (!backupEmail) {
    console.log('⚠️ BACKUP_EMAIL not set, skipping email delivery');
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured, skipping email delivery');
    return;
  }

  try {
    const transportConfig = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    // Use Gmail if configured
    if (process.env.EMAIL_SERVICE === 'gmail') {
      transportConfig.service = 'gmail';
      delete transportConfig.host;
      delete transportConfig.port;
      delete transportConfig.secure;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const filename = path.basename(backupPath);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: backupEmail,
      subject: `GTS Dashboard Backup - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>GTS Dashboard - Daily Backup</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Size:</strong> ${sizeInMB} MB</p>
        <p>The backup JSON file is attached. To restore, use: <code>npm run restore</code></p>
      `,
      attachments: [
        {
          filename,
          path: backupPath,
        },
      ],
    });

    console.log(`📧 Backup emailed to ${backupEmail}`);
  } catch (error) {
    console.error('⚠️ Failed to email backup:', error.message);
  }
}

function cleanupOldBackups(keepCount) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      files.slice(keepCount).forEach(file => {
        if (fs.lstatSync(file.path).isDirectory()) {
          fs.rmSync(file.path, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file.path);
        }
      });
    }
  } catch (error) {
    console.error('⚠️ Cleanup warning:', error.message);
  }
}

// Exported for use by notificationScheduler cron
async function runScheduledBackup() {
  try {
    const { backupPath } = await createBackup();
    await emailBackup(backupPath);
    console.log('✅ Scheduled backup complete');
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error.message);
  }
}

module.exports = { runScheduledBackup };

// Run directly if called from command line
if (require.main === module) {
  runScheduledBackup().then(() => {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
  });
}
