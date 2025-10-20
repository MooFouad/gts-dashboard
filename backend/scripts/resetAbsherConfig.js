/**
 * Reset Absher Configuration Script
 * This script deletes all existing absherconfigs and creates a fresh one with correct values
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AbsherConfig = require('../models/AbsherConfig');

async function resetAbsherConfig() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing configurations
    console.log('\n🗑️  Deleting all existing Absher configurations...');
    const deleteResult = await AbsherConfig.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} configurations`);

    // Create new configuration with correct values
    console.log('\n📝 Creating new Absher configuration...');
    const newConfig = await AbsherConfig.create({
      clientId: '3fd125a2',
      clientSecret: '42d53a3e57bfc9e87a7391c3ce633ce1',
      authorizationServer: 'https://idp.apps.devocp4.elm.sa',
      realmName: 'Tamm-QA',
      linkId: '3fd125a2',
      status: 'active',
      notes: 'QA Environment - Correct Configuration'
    });

    console.log('✅ New configuration created:');
    console.log(JSON.stringify({
      _id: newConfig._id,
      clientId: newConfig.clientId,
      clientSecret: '••••••••' + newConfig.clientSecret.slice(-4),
      authorizationServer: newConfig.authorizationServer,
      realmName: newConfig.realmName,
      linkId: newConfig.linkId,
      status: newConfig.status
    }, null, 2));

    console.log('\n✅ Absher configuration reset successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart your server: npm run dev');
    console.log('   2. Go to Settings → Absher Integration');
    console.log('   3. Click "Test Connection"');
    console.log('   4. Try syncing vehicles');

  } catch (error) {
    console.error('\n❌ Error resetting Absher configuration:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
resetAbsherConfig();
