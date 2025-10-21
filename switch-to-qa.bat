@echo off
echo ========================================
echo Switching to QA Environment
echo ========================================
echo.

cd backend
node -e "const mongoose = require('mongoose'); require('dotenv').config(); const AbsherConfig = require('./models/AbsherConfig'); mongoose.connect(process.env.MONGODB_URI).then(async () => { await AbsherConfig.updateOne({ status: 'active' }, { authorizationServer: 'https://idp.apps.devocp4.elm.sa', realmName: 'Tamm-QA' }); console.log('Updated to QA environment'); process.exit(0); });"

echo.
echo ========================================
echo Done! Restart server: npm run dev
echo ========================================
pause
