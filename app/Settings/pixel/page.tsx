'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Input } from '../../components/ui/input';
import Nav from '../../sections/nav';
import { useRouter } from 'next/navigation';

export default function PixelSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pixelId, setPixelId] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPixelSettings();
  }, []);

  const fetchPixelSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/settings/pixel');
      setPixelId(response.data.pixelId || '');
      setIsEnabled(response.data.isEnabled || false);
    } catch (error) {
      console.error('Error fetching pixel settings:', error);
      setError('Failed to load pixel settings');
      toast.error('Failed to load pixel settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await axios.put('/api/settings/pixel', {
        pixelId,
        isEnabled
      });
      
      setSuccessMessage('Facebook Pixel settings saved successfully!');
      toast.success('Facebook Pixel settings saved successfully!');
    } catch (error) {
      console.error('Error saving pixel settings:', error);
      setError('Failed to save pixel settings');
      toast.error('Failed to save pixel settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-semibold">Facebook Pixel Settings</h1>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                GET BACK
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 text-green-600 rounded">
                {successMessage}
              </div>
            )}
            
            <div className="mb-6">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                <h3 className="font-medium mb-2">About Facebook Pixel</h3>
                <p className="text-sm mb-2">Facebook Pixel helps you track visitor activity on your website, measure conversion rates, and build targeted audiences for ad campaigns.</p>
                <p className="text-sm mb-1">The following events are configured:</p>
                <ul className="list-disc list-inside text-sm ml-2">
                  <li>PageView (on all pages)</li>
                  <li>InitiateCheckout (when user starts checkout)</li>
                  <li>Purchase (when order is completed)</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Facebook Pixel ID</label>
                <Input
                  type="text"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="Enter your Facebook Pixel ID (e.g., 1234567890)"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can find your Pixel ID in the <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Facebook Events Manager</a>.
                </p>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable Facebook Pixel Tracking</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  When enabled, Facebook Pixel will track user activity on your website.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  type="button"
                  onClick={fetchPixelSettings}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 