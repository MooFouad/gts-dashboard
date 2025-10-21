@echo off
echo ========================================
echo Testing Absher QA Connection
echo ========================================
echo.
echo Your Server IP: 176.45.164.254
echo.
echo Testing Auth Server...
curl -X POST "https://idp.apps.devocp4.elm.sa/auth/realms/Tamm-QA/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=3fd125a2&client_secret=42d53a3e57bfc9e87a7391c3ce633ce1&grant_type=client_credentials" --max-time 15 -v
echo.
echo ========================================
echo Test Complete
echo ========================================
pause
