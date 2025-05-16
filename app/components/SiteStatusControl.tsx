import React, { useState, useEffect } from 'react';

export default function SiteStatusControl() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteStatus, setSiteStatus] = useState({
    active: true,
    message: 'Site is currently active',
  });

  // Fetch current site status
  useEffect(() => {
    const fetchSiteStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/settings/site-status');
        const result = await response.json();
        
        if (response.ok) {
          setSiteStatus(result.data);
        } else {
          setError(result.error || 'Failed to load site status');
        }
      } catch (error) {
        setError('Failed to connect to the server');
        console.error('Error fetching site status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSiteStatus();
  }, []);

  // Update site status
  const updateSiteStatus = async (active: boolean) => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await fetch('/api/settings/site-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active,
          message: active 
            ? 'Site is currently active' 
            : 'Site is currently under maintenance. Please check back later.',
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSiteStatus(result.data);
      } else {
        setError(result.error || 'Failed to update site status');
      }
    } catch (error) {
      setError('Failed to connect to the server');
      console.error('Error updating site status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow-md">Loading site status...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">E-commerce Site Status</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${siteStatus.active ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="font-medium">
            {siteStatus.active ? 'Active' : 'Maintenance Mode'}
          </span>
        </div>
        <p className="text-gray-600 mt-1">{siteStatus.message}</p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => updateSiteStatus(true)}
          disabled={updating || siteStatus.active}
          className={`px-4 py-2 rounded-md ${
            siteStatus.active
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          } transition-colors`}
        >
          {updating && !siteStatus.active ? 'Activating...' : 'Activate Site'}
        </button>
        
        <button
          onClick={() => updateSiteStatus(false)}
          disabled={updating || !siteStatus.active}
          className={`px-4 py-2 rounded-md ${
            !siteStatus.active
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          } transition-colors`}
        >
          {updating && siteStatus.active ? 'Deactivating...' : 'Enable Maintenance Mode'}
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> When in maintenance mode, customers will be unable 
          to place orders or browse products on the e-commerce site.
        </p>
      </div>
    </div>
  );
} 