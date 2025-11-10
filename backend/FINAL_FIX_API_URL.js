/**
 * FINAL FIX - Find and Fix ALL occurrences of wrong API URL
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function finalFix() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 COMPREHENSIVE API URL FIX');
  console.log('='.repeat(70) + '\n');

  let needsRestart = false;

  // ===== STEP 1: Check and Fix .env file =====
  console.log('📄 STEP 1: Checking .env file...\n');

  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('tamm-api.elm.sa')) {
      console.log('   ❌ Found: TAMM_API_URL=https://tamm-api.elm.sa');
      envContent = envContent.replace(/tamm-api\.elm\.sa/g, 'tamm.api.elm.sa');
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('   ✅ Fixed: TAMM_API_URL=https://tamm.api.elm.sa\n');
      needsRestart = true;
    } else {
      console.log('   ✅ .env file is correct (or doesn\'t have TAMM_API_URL)\n');
    }
  } else {
    console.log('   ℹ️  No .env file found\n');
  }

  // ===== STEP 2: Check and Fix MongoDB =====
  console.log('📊 STEP 2: Checking MongoDB database...\n');

  if (!process.env.MONGODB_URI) {
    console.log('   ⚠️  MONGODB_URI not found in .env');
    console.log('   Skipping database check\n');
  } else {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('   ✅ Connected to MongoDB\n');

      const AbsherConfigSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
      const AbsherConfig = mongoose.model('AbsherConfig', AbsherConfigSchema);

      const configs = await AbsherConfig.find({}).lean();

      if (configs.length === 0) {
        console.log('   ℹ️  No Absher configurations in database\n');
      } else {
        console.log(`   📋 Found ${configs.length} configuration(s)\n`);

        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          console.log(`   Configuration #${i + 1} (ID: ${config._id}):`);

          let needsUpdate = false;
          const updates = {};

          // Check ALL possible fields
          const fields = ['apiUrl', 'apiBaseUrl', 'baseUrl', 'tammApiUrl', 'TAMM_API_URL'];

          for (const field of fields) {
            if (config[field]) {
              console.log(`      ${field}: ${config[field]}`);
              if (config[field].includes('tamm-api.elm.sa')) {
                updates[field] = config[field].replace('tamm-api.elm.sa', 'tamm.api.elm.sa');
                console.log(`      ❌ WRONG! Fixing to: ${updates[field]}`);
                needsUpdate = true;
              }
            }
          }

          if (needsUpdate) {
            await AbsherConfig.updateOne({ _id: config._id }, { $set: updates });
            console.log('      ✅ Updated in database');
            needsRestart = true;
          } else {
            console.log('      ✅ No API URL issues');
          }
          console.log('');
        }
      }

      await mongoose.disconnect();
      console.log('   ✅ Disconnected from MongoDB\n');

    } catch (error) {
      console.log(`   ❌ Database error: ${error.message}\n`);
    }
  }

  // ===== STEP 3: Check environment variables =====
  console.log('🔧 STEP 3: Checking environment variables...\n');

  if (process.env.TAMM_API_URL) {
    console.log(`   Current TAMM_API_URL: ${process.env.TAMM_API_URL}`);
    if (process.env.TAMM_API_URL.includes('tamm-api.elm.sa')) {
      console.log('   ❌ WRONG in current session!');
      console.log('   ✅ Fixed in .env file (needs restart)\n');
    } else {
      console.log('   ✅ Correct\n');
    }
  } else {
    console.log('   ℹ️  TAMM_API_URL not set (using default)\n');
  }

  // ===== FINAL INSTRUCTIONS =====
  console.log('='.repeat(70));

  if (needsRestart) {
    console.log('🔄 CHANGES MADE - YOU MUST RESTART!');
    console.log('='.repeat(70));
    console.log('\n⚠️  CRITICAL: Backend server must be restarted:\n');
    console.log('   1. Go to your backend terminal');
    console.log('   2. Press Ctrl+C to STOP the server');
    console.log('   3. Run: node server.js');
    console.log('   4. Check logs should show: https://tamm.api.elm.sa\n');
    console.log('✅ After restart, the API URL should be CORRECT!');
  } else {
    console.log('ℹ️  NO CHANGES NEEDED');
    console.log('='.repeat(70));
    console.log('\n⚠️  API URL is correct in files, but logs show wrong URL!');
    console.log('\nThis means the wrong URL is cached in memory.\n');
    console.log('Solution: RESTART backend server anyway:');
    console.log('   1. Press Ctrl+C in backend terminal');
    console.log('   2. Run: node server.js');
    console.log('   3. Check logs carefully\n');
  }

  console.log('='.repeat(70) + '\n');
  process.exit(0);
}

finalFix();
