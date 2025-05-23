// This is a proxy endpoint that forwards requests to the admin backend
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the code from the request body
    const { code, productId } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Coupon code is required'
      });
    }

    // First try the admin API
    try {
      // Forward the request to the admin API - using /api/coupon/validate instead of /api/promocodes/validate
      const adminResponse = await fetch('https://eleveadmin.netlify.app/api/coupon/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, productId }),
      });

      // If the admin API returns a valid response, return it
      if (adminResponse.ok) {
        const data = await adminResponse.json();
        return res.status(200).json(data);
      }
    } catch (adminError) {
      console.error('Error with admin API:', adminError);
      // Continue to try other methods if admin API fails
    }

    // Then try ambassador validation logic
    // This can be a simplified version or call to another service
    // For now, we'll return a fallback error
    return res.status(404).json({
      valid: false,
      message: 'Invalid or expired coupon code'
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({
      valid: false,
      message: 'Failed to validate coupon code',
      error: error.message
    });
  }
} 