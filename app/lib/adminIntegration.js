// Collection of admin site integration functions

/**
 * Submit user email to the waitlist API
 * @param {string} email - User's email address
 * @param {string} source - Source of the submission (e.g., 'website', 'social', etc.)
 * @returns {Promise<boolean>} Success status
 */
export async function submitToWaitlist(email, source = 'website') {
  try {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://eleveadmin.netlify.app';
    const response = await fetch(`${adminUrl}/api/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source,
      }),
    });

    if (response.ok) {
      console.log('Waitlist submission successful');
      return true;
    } else {
      console.error('Waitlist submission failed with status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.error('Error details:', data);
      return false;
    }
  } catch (error) {
    console.error('Error submitting to waitlist:', error);
    return false;
  }
}

/**
 * Fetch current site status from admin API
 * @returns {Promise<{status: string, message: string}>} Site status object
 */
export async function getSiteStatus() {
  try {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://eleveadmin.netlify.app';
    const response = await fetch(`${adminUrl}/api/site-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache this response
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to fetch site status with status:', response.status);
      // Default to active on error to prevent unnecessary blocking
      return { status: 'active', message: 'Site is active' };
    }
  } catch (error) {
    console.error('Error fetching site status:', error);
    // Default to active on error to prevent unnecessary blocking
    return { status: 'active', message: 'Site is active' };
  }
} 