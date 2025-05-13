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
echo === Step 2: Environment check ===
echo Node version:
node -v
echo NPM version:
npm -v

echo.
echo === Step 3: Prepare deployment ===
echo Installing dependencies...
npm install --legacy-peer-deps

echo.
echo === Step 4: Deploy to Netlify ===
echo.
echo Starting Netlify deployment...
netlify deploy --prod

echo.
echo === Deployment process complete ===
echo Check the Netlify dashboard for build status.
echo.
echo If you encounter issues, check:
echo - Environment variables in Netlify
echo - MongoDB connection string (no quotes)
echo - Visit https://[your-site].netlify.app/api/diagnose for diagnostics
echo.

pause 