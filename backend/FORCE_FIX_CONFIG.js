/**
 * FORCE FIX - Update Absher Configuration
 * This script will show you exactly what's in the database and fix it
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AbsherConfigSchema = new mongoose.Schema({
  clientId: String,
  clientSecret: String,
  authorizationServer: String,
  realmName: String,
  linkId: String,
  status: String,
  notes: String
}, { timestamps: true });

async function fixConfig() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 FORCE FIX ABSHER CONFIGURATION');
  console.log('='.repeat(70) + '\n');

  try {
    // Check MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ ERROR: MONGODB_URI not found in .env file!');
      console.log('\n💡 Create a .env file in backend folder with:');
      console.log('   MONGODB_URI=mongodb+srv://your-connection-string');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    const AbsherConfig = mongoose.model('AbsherConfig', AbsherConfigSchema);

    // Find all configs
    const configs = await AbsherConfig.find({});

    console.log(`📊 Found ${configs.length} configuration(s) in database\n`);

    if (configs.length === 0) {
      console.log('❌ No configuration found!');
      console.log('\n💡 You need to create a configuration first:');
      console.log('   1. Go to Dashboard → Absher tab');
      console.log('   2. Click on Settings/Configuration icon');
      console.log('   3. Enter your credentials and save');
      console.log('   4. Then run this script again\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show and fix each config
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];

      console.log(`📋 Configuration #${i + 1}:`);
      console.log('   ─────────────────────────────────────────────');
      console.log(`   ID: ${config._id}`);
      console.log(`   Client ID: ${config.clientId ? '***' + config.clientId.slice(-4) : 'NOT SET'}`);
      console.log(`   Status: ${config.status}`);
      console.log(`   Auth Server: ${config.authorizationServer}`);
      console.log(`   Realm Name: ${config.realmName}`);
      console.log(`   Created: ${config.createdAt}`);

      // Check if it needs fixing
      const isQA = config.authorizationServer?.includes('devocp4') || config.realmName === 'Tamm-QA';

      if (isQA) {
        console.log('\n   ⚠️  Using QA ENVIRONMENT - FIXING NOW...');

        // Update to Production
        config.authorizationServer = 'https://idp.elm.sa';
        config.realmName = 'Tamm';
        config.notes = `Fixed to Production on ${new Date().toLocaleString()}`;

        await config.save();

        console.log('   ✅ FIXED! New values:');
        console.log(`   Auth Server: ${config.authorizationServer}`);
        console.log(`   Realm Name: ${config.realmName}`);
      } else {
        console.log('\n   ✅ Already using PRODUCTION environment');
      }

      console.log('');
    }

    console.log('='.repeat(70));
    console.log('✅ DATABASE UPDATE COMPLETE!');
    console.log('='.repeat(70));

    console.log('\n🔄 CRITICAL NEXT STEP:');
    console.log('   YOU MUST RESTART YOUR BACKEND SERVER NOW!');
    console.log('   The configuration is loaded at startup.');
    console.log('\n   How to restart:');
    console.log('   1. Go to your backend terminal');
    console.log('   2. Press Ctrl+C to stop the server');
    console.log('   3. Run: node server.js');
    console.log('   4. Check the startup logs\n');

    console.log('✅ After restart, you should see:');
    console.log('   Auth URL: https://idp.elm.sa/auth/realms/Tamm/...');
    console.log('   Realm: Tamm\n');

    await mongoose.disconnect();
    console.log('✅ Done!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Cannot connect to MongoDB!');
      console.log('   Check your MONGODB_URI in .env file');
      console.log('   Make sure MongoDB is accessible');
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

fixConfig();
