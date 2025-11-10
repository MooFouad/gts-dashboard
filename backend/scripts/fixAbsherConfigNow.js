/**
 * IMMEDIATE FIX: Update Absher Config to Production
 * Run this script to fix the database configuration NOW
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixAbsherConfig() {
  try {
    console.log('\n🔧 FIXING ABSHER CONFIGURATION\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${process.env.MONGODB_URI ? 'Found' : 'NOT FOUND'}`);

    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file!');
      console.log('\n💡 Please check your .env file contains:');
      console.log('   MONGODB_URI=mongodb+srv://...');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define schema inline to avoid require issues
    const absherConfigSchema = new mongoose.Schema({
      clientId: String,
      clientSecret: String,
      authorizationServer: String,
      realmName: String,
      linkId: String,
      status: String,
      lastTestedAt: Date,
      lastSyncDate: Date,
      lastTestResult: Object,
      notes: String
    }, { timestamps: true });

    const AbsherConfig = mongoose.models.AbsherConfig || mongoose.model('AbsherConfig', absherConfigSchema);

    // Find all configs
    const configs = await AbsherConfig.find({});
    console.log(`📊 Found ${configs.length} Absher configuration(s)\n`);

    if (configs.length === 0) {
      console.log('❌ No Absher configuration found in database!');
      console.log('\n💡 Please configure Absher via the UI first:');
      console.log('   1. Go to Dashboard → Absher tab');
      console.log('   2. Click Settings/Configuration');
      console.log('   3. Enter your credentials');
      console.log('   4. Then run this script again');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Update each config
    for (const config of configs) {
      console.log('📋 CURRENT Configuration:');
      console.log(`   ID: ${config._id}`);
      console.log(`   Client ID: ***${config.clientId ? config.clientId.slice(-4) : 'NONE'}`);
      console.log(`   Auth Server: ${config.authorizationServer}`);
      console.log(`   Realm Name: ${config.realmName}`);
      console.log(`   Status: ${config.status}`);

      // Check if already production
      if (config.authorizationServer === 'https://idp.elm.sa' && config.realmName === 'Tamm') {
        console.log('\n✅ Already using PRODUCTION environment!');
        console.log('\n⚠️  But you still see QA in logs?');
        console.log('   This means the service hasn\'t reloaded.');
        console.log('   Solution: RESTART YOUR BACKEND SERVER');
        continue;
      }

      // Update to Production
      console.log('\n🔄 Updating to PRODUCTION...');
      config.authorizationServer = 'https://idp.elm.sa';
      config.realmName = 'Tamm';
      config.notes = `Production Environment - Fixed on ${new Date().toISOString()}`;
      await config.save();

      console.log('\n✅ UPDATED to Production:');
      console.log(`   Auth Server: ${config.authorizationServer}`);
      console.log(`   Realm Name: ${config.realmName}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE UPDATE COMPLETE!');
    console.log('='.repeat(60));

    console.log('\n🔄 NEXT STEPS:');
    console.log('   1. RESTART your backend server (Ctrl+C then restart)');
    console.log('   2. Check logs should show:');
    console.log('      Auth URL: https://idp.elm.sa/auth/realms/Tamm/...');
    console.log('      Realm: Tamm');
    console.log('   3. If still shows QA, the service is caching old config');
    console.log('      → Delete node_modules/.cache if exists');
    console.log('      → Restart backend again');

    console.log('\n⚠️  ABOUT THE TIMEOUT ERROR:');
    console.log('   Even after this fix, you may still get ETIMEDOUT.');
    console.log('   This is NORMAL if:');
    console.log('   • No VPN connected to Saudi Arabia');
    console.log('   • IP not whitelisted in Absher Business Portal');
    console.log('   • Using QA credentials with Production environment');
    console.log('\n   The important thing is to see PRODUCTION URLs in logs!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAbsherConfig();
