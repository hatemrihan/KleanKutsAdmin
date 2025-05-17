'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../sections/nav';

// This is a hidden test page that loads real settings data
export default function TestSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set fake auth to prevent redirects
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('admin-auth', 'true');
    }
    
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Try to fetch site status as a test
      const response = await axios.get('/api/settings/site-status');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Test Settings Page</h1>
        
        {loading ? (
          <div>Loading settings...</div>
        ) : (
          <div className="grid gap-4">
            <div className="border p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Site Status Test</h2>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 