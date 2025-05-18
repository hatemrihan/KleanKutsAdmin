# Eleve Egypt Admin

## Waitlist Mode Implementation

When the e-commerce site status is set to "inactive" in the admin dashboard, customers will be redirected to a waitlist page instead of accessing the main site.

### Setup Instructions:

1. **Set Site Status**: 
   - Go to Settings > Site Status in the admin dashboard
   - Toggle "Enable Maintenance Mode" when you want to show the waitlist page

2. **Waitlist Video**:
   - Add a promotional video file at `public/videos/waitlist.mp4`
   - This video will be displayed on the waitlist page

3. **API Integration**:
   - The waitlist form submits data to `/api/waitlist` endpoint
   - Received emails will be stored in the database

### Developer Notes:

- The site status is stored in the database under the key `site_status`
- The middleware checks this status and redirects users accordingly
- Admin pages are exempt from redirection to allow management 
