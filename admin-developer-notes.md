# Administrator Integration Notes

## Important Integration Points

### API Integration

The main customer-facing site now attempts to notify the admin site about new ambassador requests. There's a placeholder for implementing a proper `/api/notifications` endpoint on the admin site.

**Implementation Required:**
- Create a new `/api/notifications` endpoint on the admin site to receive updates from the main site
- This endpoint should process incoming notifications about new ambassador applications
- Consider implementing a secure notification system with authentication tokens

### Data Structure

Ambassador records now include a complete `applicationDetails` field containing all form data, which can be displayed in the admin dashboard.

**Integration Notes:**
- Update your Ambassador model and UI to display this expanded application data
- Create sortable/filterable views for the expanded application fields
- Ensure proper data validation when processing this information

### Environment Variables

The system uses environment variables for proper domain configuration. Make sure these are set correctly in your deployment environment:

```
NEXT_PUBLIC_APP_URL = "https://elevee.netlify.app"
NEXT_PUBLIC_ADMIN_URL = "https://eleveadmin.netlify.app"
```

**Important:**
- These variables are critical for cross-domain communication
- Ensure they are properly set in your Netlify deployment settings
- Local development should use appropriate local URLs

### Authentication Flow

Users are now properly maintained in their current context during authentication, which will help admins who need to switch between the main and admin sites.

**Note for Implementation:**
- Respect this flow when implementing new authentication-related features
- Do not redirect admins unexpectedly between sites
- Consider the multi-site context when handling sessions and tokens

## Integration with Ambassador Application System

The new ambassador application system should be integrated with the existing implementation according to the specifications in:
- `ambassador-integration-guide.md`
- `ambassador-api-endpoint-guide.md`

## API Testing

Use the testing procedures and functions in `api-test-guide.md` to verify your implementation is working correctly with the customer-facing site. 