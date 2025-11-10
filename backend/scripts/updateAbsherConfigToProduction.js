/**
 * Update Absher Configuration to Production Environment
 * Run this script to fix the database configuration
 */

const mongoose = require('mongoose');
require('dotenv').config();

const AbsherConfig = require('../models/AbsherConfig');

async function updateToProduction() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the active configuration
    const config = await AbsherConfig.findOne({ status: 'active' });

    if (!config) {
      console.log('❌ No active Absher configuration found in database');
      console.log('💡 Please configure Absher settings via the UI first');
      process.exit(1);
    }

    console.log('\n📋 Current Configuration:');
    console.log(`   Client ID: ***${config.clientId.slice(-4)}`);
    console.log(`   Auth Server: ${config.authorizationServer}`);
    console.log(`   Realm Name: ${config.realmName}`);
    console.log(`   Status: ${config.status}`);

    // Update to Production environment
    console.log('\n🔄 Updating to Production environment...');

    config.authorizationServer = 'https://idp.elm.sa';
    config.realmName = 'Tamm';
    config.notes = 'Production Environment - Updated automatically';

    await config.save();

    console.log('\n✅ Configuration updated successfully!');
    console.log('\n📋 New Configuration:');
    console.log(`   Client ID: ***${config.clientId.slice(-4)}`);
    console.log(`   Auth Server: ${config.authorizationServer}`);
    console.log(`   Realm Name: ${config.realmName}`);
    console.log(`   Status: ${config.status}`);

    console.log('\n⚠️  Important Notes:');
    console.log('   1. Make sure your Client ID and Secret are for PRODUCTION');
    console.log('   2. Production requires VPN or IP whitelisting');
    console.log('   3. Test the connection after this update');

    console.log('\n🔄 Restart your backend server to apply changes');

  } catch (error) {
    console.error('❌ Error updating configuration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

updateToProduction();
