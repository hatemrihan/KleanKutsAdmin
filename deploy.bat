@echo off
echo ===== Elevee Admin Netlify Deployment Helper =====
echo.

echo Checking for dependencies...
where netlify >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Netlify CLI not found. Installing...
  npm install -g netlify-cli
)

echo.
echo === Step 1: Clean up ===
echo Cleaning npm cache...
npm cache clean --force

echo.
echo === Step 2: Reset installation if needed ===
choice /c YN /m "Do you want to reset the npm installation (removes package-lock.json and node_modules)?"
if %ERRORLEVEL% equ 1 (
  node scripts/reset-install.js
  echo Installing dependencies...
  npm install --legacy-peer-deps --prefer-offline
) else (
  echo Skipping reset.
)

echo.
echo === Step 3: Deploy to Netlify ===
echo Starting Netlify deployment...
netlify deploy --prod

echo.
echo === Deployment process complete ===
echo Check the Netlify dashboard for build status.
echo.
echo If you encounter issues, visit: https://eleveadmin.netlify.app/api/diagnose
echo.
pause 