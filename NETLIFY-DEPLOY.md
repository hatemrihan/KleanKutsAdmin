# Netlify Deployment Guide for Elevee Admin

## Overview
This document provides instructions for deploying the Elevee Admin panel to Netlify.

## Prerequisites
- A Netlify account
- Access to the GitHub repository

## Environment Variables
Ensure the following environment variables are set in Netlify:

1. **MONGODB_URI** - MongoDB connection string (must start with mongodb:// or mongodb+srv://)
2. **MONGODB_DB** - Database name (defaults to "elevee" if not specified)
3. **CLOUDINARY_CLOUD_NAME** - Cloudinary cloud name
4. **CLOUDINARY_API_KEY** - Cloudinary API key
5. **CLOUDINARY_API_SECRET** - Cloudinary API secret
6. **CLOUDINARY_UPLOAD_PRESET** - Cloudinary upload preset (keep as "kleankuts_upload" for now)
7. **NEXTAUTH_URL** - Full URL of the deployed admin site
8. **NEXTAUTH_SECRET** - Secret key for NextAuth

## Important Notes

### MongoDB Connection
- Make sure your MongoDB URI doesn't have any quotes around it
- Format must be: `mongodb+srv://username:password@hostname/database`
- Double-check for any extra characters that might break the connection

### Cloudinary Configuration
- Keep using the existing Cloudinary preset "kleankuts_upload" for now
- The system will need to be updated if changing this in the future

## Troubleshooting

### Build Failures
If your build fails:

1. Check the build logs for specific error messages
2. Verify all environment variables are correctly set
3. Try the "Clear cache and deploy site" option in Netlify
4. If errors persist, run the diagnostic API endpoint after deployment:
   ```
   https://your-site.netlify.app/api/diagnose
   ```

### Connection Issues
If the admin panel deploys but shows connection errors:

1. Check MongoDB connection string format in your environment variables
2. Verify MongoDB network access settings allow connections from Netlify IPs
3. Review the MongoDB Atlas dashboard for connection metrics
4. Inspect browser developer console for detailed error messages

## Post-Deployment Verification
After deploying, verify the following:

1. Dashboard loads with statistics and data
2. Orders can be viewed and modified
3. Products can be added and edited
4. Image uploads to Cloudinary work correctly

## Support
For additional help, contact the development team.

---

Last updated: May 2024 