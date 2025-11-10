/**
 * FIX DATABASE API URL
 * This will check if you entered the API URL via UI and fix it
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixDatabaseApiUrl() {
  console.log('\n🔧 CHECKING DATABASE FOR API URL\n');
  console.log('='.repeat(60));

  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const AbsherConfigSchema = new mongoose.Schema({}, { strict: false });
    const AbsherConfig = mongoose.model('AbsherConfig', AbsherConfigSchema);

    const configs = await AbsherConfig.find({});

    if (configs.length === 0) {
      console.log('ℹ️  No Absher configuration in database');
      console.log('   API URL must be coming from .env file');
      console.log('\n💡 Check your .env file for TAMM_API_URL');
      console.log('   Should be: https://tamm.api.elm.sa');
      console.log('   NOT: https://tamm-api.elm.sa\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📊 Found ${configs.length} configuration(s)\n`);

    let fixed = 0;
    for (const config of configs) {
      console.log('📋 Configuration:');
      console.log(`   ID: ${config._id}`);

      // Check all possible API URL fields
      const fields = ['apiUrl', 'apiBaseUrl', 'baseUrl', 'tammApiUrl'];
      let foundWrong = false;

      for (const field of fields) {
        if (config[field] && config[field].includes('tamm-api.elm.sa')) {
          console.log(`   ❌ Wrong ${field}: ${config[field]}`);
          config[field] = config[field].replace('tamm-api.elm.sa', 'tamm.api.elm.sa');
          console.log(`   ✅ Fixed ${field}: ${config[field]}`);
          foundWrong = true;
        }
      }

      if (foundWrong) {
        await config.save();
        fixed++;
        console.log('   ✅ Saved to database\n');
      } else {
        console.log('   ✅ No API URL issues found in this config\n');
      }
    }

    console.log('='.repeat(60));
    if (fixed > 0) {
      console.log(`✅ Fixed ${fixed} configuration(s)!`);
      console.log('\n🔄 RESTART YOUR BACKEND:');
      console.log('   1. Press Ctrl+C');
      console.log('   2. Run: node server.js');
      console.log('   3. Check logs');
    } else {
      console.log('ℹ️  No API URL found in database config');
      console.log('\n💡 The API URL must be in your .env file');
      console.log('   Run: node FIX_API_URL.js');
    }
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixDatabaseApiUrl();
