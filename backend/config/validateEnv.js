const requiredEnvVars = [
  'MONGODB_URI',
  'PORT',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL',
  'EMAIL_USER',
  'EMAIL_PASS',
  // EMAIL_SERVICE is optional - only needed for Gmail, not for custom SMTP
  'APP_URL'
];

const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('   See .env.example for reference.\n');
    throw new Error('Missing required environment variables. Cannot start server.');
  }

  console.log('✅ All required environment variables are set');
};

module.exports = validateEnv;
