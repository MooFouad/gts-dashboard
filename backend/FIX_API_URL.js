/**
 * FIX API URL - Change tamm-api.elm.sa to tamm.api.elm.sa
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('\n🔧 FIXING API URL\n');
console.log('='.repeat(60));

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('✅ No .env file found - this is OK!');
  console.log('   The default API URL in code is correct.');
  console.log('   You may have entered wrong URL in the UI.\n');
  console.log('💡 Solution: Update via UI:');
  console.log('   1. Go to Dashboard → Absher Settings');
  console.log('   2. Make sure API URL is NOT saved there');
  console.log('   3. Or check TAMM_API_URL in your .env file');
  console.log('='.repeat(60) + '\n');
  process.exit(0);
}

// Read .env file
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('📄 Checking .env file...\n');

// Check for the wrong URL
if (envContent.includes('tamm-api.elm.sa')) {
  console.log('❌ Found WRONG API URL: https://tamm-api.elm.sa');
  console.log('🔄 Fixing to: https://tamm.api.elm.sa\n');

  // Replace the wrong URL
  envContent = envContent.replace(/tamm-api\.elm\.sa/g, 'tamm.api.elm.sa');

  // Write back to file
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('✅ FIXED! .env file updated\n');
  console.log('='.repeat(60));
  console.log('🔄 RESTART YOUR BACKEND NOW:');
  console.log('   1. Press Ctrl+C in backend terminal');
  console.log('   2. Run: node server.js');
  console.log('   3. Check logs should show: tamm.api.elm.sa');
  console.log('='.repeat(60) + '\n');

} else if (envContent.includes('tamm.api.elm.sa')) {
  console.log('✅ .env file has CORRECT API URL');
  console.log('   https://tamm.api.elm.sa\n');
  console.log('⚠️  But your logs show wrong URL!');
  console.log('   This means it might be set in database via UI.\n');
  console.log('💡 Check your Absher configuration in UI');
  console.log('='.repeat(60) + '\n');

} else {
  console.log('ℹ️  No TAMM_API_URL found in .env file');
  console.log('   Using default from code (which is correct)\n');
  console.log('⚠️  But your logs show wrong URL!');
  console.log('   This means it was entered wrong via UI.\n');
  console.log('💡 Solution: Update via database script');
  console.log('='.repeat(60) + '\n');
}
