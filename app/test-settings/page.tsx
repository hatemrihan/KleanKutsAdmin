'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import Nav from '../sections/nav';
import { CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useRouter } from 'next/navigation';
import { DarkModePanel, DarkModeText, DarkModeInput } from "../components/ui/dark-mode-wrapper";

interface ApiErrorResponse {
  error: string;
}

interface SiteStatus {
  active: boolean;
  message: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [siteStatusLoading, setSiteStatusLoading] = useState(false);
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({
    active: true,
    message: 'Site is currently active'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'site' | 'tracking' | 'security'>('site');
  const [settings, setSettings] = useState<Record<string, string>>({
    facebookPixel: '',
    googleAnalytics: ''
  });
  const [currentSaving, setCurrentSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteStatus();
  }, []);

  const fetchSiteStatus = async () => {
    try {
      setSiteStatusLoading(true);
      const response = await axios.get('/api/settings/site-status');
      if (response.data.status === 'success') {
        setSiteStatus(response.data.data);
        setMaintenanceMessage(response.data.data.message || '');
      }
    } catch (error) {
      console.error('Error fetching site status:', error);
      toast.error('Failed to fetch site status');
    } finally {
      setSiteStatusLoading(false);
    }
  };

  const handleToggleSiteStatus = async () => {
    try {
      setSiteStatusLoading(true);
      const newStatus = !siteStatus.active;
      
      // Make API call to update site status
      const response = await axios.post('/api/settings/site-status', {
        active: newStatus,
        message: newStatus ? '' : (maintenanceMessage || 'Site is under maintenance')
      });
      
      if (response.data.status === 'success') {
        setSiteStatus(response.data.data);
        toast.success(`Site is now ${newStatus ? 'active' : 'in maintenance mode'}`);
      }
    } catch (error) {
      console.error('Error updating site status:', error);
      toast.error('Failed to update site status');
    } finally {
      setSiteStatusLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.put('/api/settings/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password updated successfully');
        
        // Update localStorage with the new authentication status
        localStorage.setItem('adminAuthenticated', 'true');
        
        // Clear the form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Show additional message about logging in with new password next time
        setTimeout(() => {
          toast.success('You will use this new password for your next login');
        }, 1500);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error updating password:', error);
      
      // Check for specific error cases
      if (axiosError.response?.status === 400) {
        toast.error('Current password is incorrect');
      } else {
        toast.error(axiosError.response?.data?.error || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettingValue = async (key: string) => {
    try {
      setIsLoading(true);
      setCurrentSaving(key);
      
      // Make API call to save settings
      await axios.post('/api/settings', {
        key,
        value: settings[key]
      });
      
      toast.success(`${key} setting saved successfully`);
    } catch (error) {
      console.error(`Error saving ${key} setting:`, error);
      toast.error(`Failed to save ${key} setting`);
    } finally {
      setIsLoading(false);
      setCurrentSaving(null);
    }
  };

  const trackingOptions = [
    {
      title: 'Facebook Pixel',
      description: 'Configure Meta Pixel tracking for your e-commerce store',
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
        </svg>
      ),
      key: 'facebookPixel',
      placeholder: 'Enter your Meta Pixel ID',
    },
    {
      title: 'Google Analytics',
      description: 'Add Google Analytics tracking to your store',
      icon: (
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"/>
        </svg>
      ),
      key: 'googleAnalytics',
      placeholder: 'Enter your Google Analytics Measurement ID',
    }
  ];

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Page title with Dashboard-style font */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Settings
            </h1>
            <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700 mx-2 sm:mx-0">
            <button
              className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${activeTab === 'site' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('site')}
            >
              Site Status
            </button>
            <button
              className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${activeTab === 'tracking' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('tracking')}
            >
              Tracking
            </button>
            <button
              className={`py-2 px-3 sm:px-4 text-sm sm:text-base ${activeTab === 'security' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>
            
          {/* Site Status Tab */}
          {activeTab === 'site' && (
            <DarkModePanel className="rounded-lg shadow-sm mb-4 sm:mb-6 mx-2 sm:mx-0">
              <CardHeader className="pb-3 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold dark:text-white">
                      Site Status
                    </CardTitle>
                    <CardDescription className="dark:text-white/70 text-sm sm:text-base">
                      Control whether your e-commerce store is live or in maintenance mode
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-white/70">
                      {siteStatus.active ? 'Active' : 'Maintenance Mode'}
                    </span>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-outline-none bg-gray-200 dark:bg-gray-700">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={siteStatus.active}
                        onChange={handleToggleSiteStatus}
                        disabled={siteStatusLoading}
                        id="site-toggle"
                      />
                      <span 
                        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${siteStatus.active ? 'translate-x-5' : ''}`}
                      />
                      <label 
                        htmlFor="site-toggle" 
                        className={`absolute inset-0 cursor-pointer rounded-full ${siteStatus.active ? 'bg-green-500' : 'bg-gray-500'}`}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-white mb-1">
                      Maintenance Message
                    </label>
                    <textarea
                      className="w-full min-h-[80px] sm:min-h-[100px] p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-black dark:text-white text-sm sm:text-base"
                      placeholder="Enter a message to display when your site is in maintenance mode"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      disabled={siteStatusLoading || siteStatus.active}
                    />
                  </div>
                  
                  {!siteStatus.active && (
                    <button
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium dark:bg-blue-700 dark:hover:bg-blue-800"
                      onClick={handleToggleSiteStatus}
                      disabled={siteStatusLoading}
                    >
                      {siteStatusLoading ? 'Updating...' : 'Activate Site'}
                    </button>
                  )}
                </div>
              </CardContent>
            </DarkModePanel>
          )}
          
          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="grid gap-4 sm:gap-6 mx-2 sm:mx-0">
              {trackingOptions.map((option) => (
                <DarkModePanel key={option.key} className="rounded-lg shadow-sm">
                  <CardHeader className="pb-3 p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="mr-0 sm:mr-3">{option.icon}</div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-semibold dark:text-white">{option.title}</CardTitle>
                        <CardDescription className="dark:text-white/70 text-sm sm:text-base">{option.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <DarkModeInput
                      placeholder={option.placeholder}
                      value={settings[option.key] || ''}
                      onChange={(e) => handleSettingChange(option.key, e.target.value)}
                      className="w-full text-sm sm:text-base"
                    />
                    <div className="flex justify-end mt-3 sm:mt-4">
                      <button
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium dark:bg-blue-700 dark:hover:bg-blue-800"
                        onClick={() => saveSettingValue(option.key)}
                        disabled={isLoading}
                      >
                        {isLoading && currentSaving === option.key ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </CardContent>
                </DarkModePanel>
              ))}
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <DarkModePanel className="rounded-lg shadow-sm mx-2 sm:mx-0">
              <CardHeader className="pb-3 p-3 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold dark:text-white">
                  Change Password
                </CardTitle>
                <CardDescription className="dark:text-white/70 text-sm sm:text-base">
                  Update your admin account password
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-white mb-1">
                      Current Password
                    </label>
                    <DarkModeInput
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className="w-full text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-white mb-1">
                      New Password
                    </label>
                    <DarkModeInput
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                      className="w-full text-sm sm:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-white mb-1">
                      Confirm New Password
                    </label>
                    <DarkModeInput
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      className="w-full text-sm sm:text-base"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium dark:bg-blue-700 dark:hover:bg-blue-800"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </CardContent>
            </DarkModePanel>
          )}
        </div>
      </main>
    </div>
  );
}