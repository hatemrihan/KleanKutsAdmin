# Maintenance Mode Implementation Guide

This document provides instructions for implementing maintenance mode in the Elevee e-commerce storefront.

## Overview

The admin panel can set the site to maintenance mode, but the storefront must check this status and display a maintenance page when appropriate. This document explains how to implement this functionality.

## API Endpoint

The admin panel exposes an API endpoint that returns the current site status:

```
GET https://eleveadmin.netlify.app/api/site-status
```

Response format:
```json
{
  "active": false,
  "message": "Site is currently under maintenance. Please check back later."
}
```

- `active`: Boolean flag indicating if the site is active (false = maintenance mode)
- `message`: Custom maintenance message set by the admin

## Implementation Steps

### 1. Create a Maintenance Page Component

Create a `MaintenancePage.jsx` component:

```jsx
import React from 'react';

const MaintenancePage = ({ message }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Site Under Maintenance</h1>
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">
          {message || "We're currently updating our site to serve you better. Please check back soon."}
        </p>
        <p className="text-sm text-gray-500">
          - The Elevee Team
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
```

### 2. Create a Site Status Provider

Create a context provider to handle site status checks:

```jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const SiteStatusContext = createContext({
  isActive: true,
  message: '',
  isLoading: true,
});

export const SiteStatusProvider = ({ children }) => {
  const [status, setStatus] = useState({
    isActive: true,
    message: '',
    isLoading: true,
  });

  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
        const response = await fetch('https://eleveadmin.netlify.app/api/site-status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch site status');
        }
        
        const data = await response.json();
        
        setStatus({
          isActive: data.active,
          message: data.message || '',
          isLoading: false,
        });
        
        console.log('Site status:', data.active ? 'ACTIVE' : 'MAINTENANCE');
      } catch (error) {
        console.error('Error checking site status:', error);
        // Default to active if there's an error fetching status
        setStatus({
          isActive: true,
          message: '',
          isLoading: false,
        });
      }
    };

    checkSiteStatus();
  }, []);

  return (
    <SiteStatusContext.Provider value={status}>
      {children}
    </SiteStatusContext.Provider>
  );
};

export const useSiteStatus = () => useContext(SiteStatusContext);
```

### 3. Add the SiteStatusCheck Component

Create a wrapper component that shows either the maintenance page or the actual site content:

```jsx
import React from 'react';
import { useSiteStatus } from './SiteStatusProvider';
import MaintenancePage from './MaintenancePage';

const SiteStatusCheck = ({ children }) => {
  const { isActive, message, isLoading } = useSiteStatus();

  // Show loading indicator while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  // Show maintenance page if site is inactive
  if (!isActive) {
    return <MaintenancePage message={message} />;
  }

  // Show regular content if site is active
  return <>{children}</>;
};

export default SiteStatusCheck;
```

### 4. Implement in the Main App Component

Wrap your application with the `SiteStatusProvider` and `SiteStatusCheck`:

```jsx
import { SiteStatusProvider } from './SiteStatusProvider';
import SiteStatusCheck from './SiteStatusCheck';

function MyApp({ Component, pageProps }) {
  return (
    <SiteStatusProvider>
      <SiteStatusCheck>
        <Component {...pageProps} />
      </SiteStatusCheck>
    </SiteStatusProvider>
  );
}

export default MyApp;
```

## Testing Maintenance Mode

1. Set the site to maintenance mode in the admin panel
2. Visit the e-commerce storefront
3. Verify that the maintenance page is displayed
4. Set the site back to active in the admin panel
5. Verify that the regular site content is displayed again

## Troubleshooting

If the maintenance mode detection is not working:

1. Check the browser console for any errors
2. Verify that the API endpoint is accessible from the storefront (CORS issues)
3. Confirm that the site status is correctly set in the admin panel
4. Check that the `SiteStatusProvider` is fetching data correctly

## Additional Considerations

- Consider implementing a cache or local storage mechanism to prevent excessive API calls
- Add a refresh mechanism to periodically check if maintenance mode has been disabled
- For authenticated users or admins, you could add a "preview" mode to bypass maintenance mode 