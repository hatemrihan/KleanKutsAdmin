# Ambassador Application System Implementation Guide

## Overview
We've enhanced the ambassador program with a comprehensive application form and terms & conditions. This document provides the implementation details for the Admin AI developer.

## 1. API Endpoint Structure
The application form data is submitted to `/api/ambassador/request` with the following structure:

```javascript
{
  // Basic user info from NextAuth
  name: string,
  email: string,
  
  // Complete form data object containing all fields
  formData: {
    fullName: string,
    phoneNumber: string,
    email: string,
    instagramHandle: string,
    tiktokHandle: string,
    otherSocialMedia: string,
    personalStyle: string,    // One of 4 predefined options
    soldBefore: string,       // 'Yes' or 'No'
    promotionPlan: string,    // Open text field
    investmentOption: string, // One of 3 predefined options
    contentComfort: string,   // One of 3 predefined options
    instagramFollowers: string,
    tiktokFollowers: string,
    otherFollowers: string,
    targetAudience: string,   // One of 4 predefined options
    otherAudience: string,    // Only filled if targetAudience is 'Other'
    motivation: string,       // Open text field
    hasCamera: string,        // 'Yes' or 'No'
    attendEvents: string,     // 'Yes', 'No' or 'Depends'
    agreeToTerms: string,     // 'Yes, I agree' or 'No, I need more information'
    additionalInfo: string,   // Open text field
    questions: string         // Open text field
  }
}
```

## 2. Required Backend Changes

### Data Processing
- Process and store all new form fields
- Validate required fields (name, email, phone, Instagram handle)
- Check if applicants meet minimum follower requirements (if any)
- Save investment preferences for analysis

### Admin Dashboard Requirements
- Display all application data in a sortable/filterable way
- Allow admins to approve/reject applications
- Enable admins to export data for analysis
- Show statistics of incoming applications

### Notification Systems
- Email notifications to admins when new applications arrive
- Confirmation emails to applicants
- Status update emails when applications are approved/rejected

## 3. Database Schema Updates

The ambassador users collection will need new fields to store all form data. Consider creating related collections for:

- Ambassador metrics & performance tracking
- Investment tier management
- Commission rate calculations
- Sales attribution

## 4. Status Tracking

The ambassador application status can be:

- `none` - Never applied
- `pending` - Application submitted, awaiting review
- `approved` - Application approved, active ambassador
- `rejected` - Application rejected

Each status should trigger appropriate frontend displays and actions.

## 5. Integration with Existing Ambassador Program

The new application system should integrate with the existing ambassador program features:

- Coupon code generation system
- Discount percentage management
- Sales tracking and commission calculation
- Performance metrics dashboard

## 6. Testing Plan

Use the testing functions in `api-test-guide.md` to verify the API endpoints work correctly after implementation. Ensure:

1. The ambassador application process works end-to-end
2. Approving an ambassador correctly generates their referral code and discount
3. The coupon validation and redemption process functions properly
4. Cross-domain CORS handling works between frontend and admin systems

## 7. Security Considerations

- Implement proper validation for all form fields to prevent injection attacks
- Ensure only authenticated administrators can approve/reject applications
- Protect sensitive ambassador information with appropriate access controls
- Validate coupon codes securely to prevent exploitation 