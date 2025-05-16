'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import Nav from '../../sections/nav';
import { useRouter } from 'next/navigation';
import { Input } from '../../components/ui/input';

interface ApiErrorResponse {
  error: string;
}

export default function SiteStatusPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [siteStatus, setSiteStatus] = useState({
    active: true,
    message: 'Site is currently active'
  });
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'site' | 'profile' | 'password'>('site');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isFormLoading, setIsFormLoading] = useState(false);

  useEffect(() => {
    fetchSiteStatus();
  }, []);

  const fetchSiteStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/settings/site-status');
      if (response.data.status === 'success') {
        setSiteStatus(response.data.data);
        setMaintenanceMessage(response.data.data.message || '');
      }
    } catch (error) {
      console.error('Error fetching site status:', error);
      toast.error('Failed to fetch site status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSiteStatus = async () => {
    try {
      setIsLoading(true);
      const newStatus = !siteStatus.active;
      
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
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsFormLoading(true);
      // Add your profile update logic here
      toast.success('Profile updated successfully');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error updating profile:', error);
      toast.error(axiosError.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsFormLoading(false);
    }
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
      setIsFormLoading(true);
      const response = await axios.put('/api/settings/otp-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Password updated successfully');
        
        // Important: Update localStorage with the new authentication status
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
      setIsFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-semibold">Settings</h1>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                GET BACK
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex flex-wrap -mb-px">
                <button
                  onClick={() => setActiveTab('site')}
                  className={`inline-block p-4 ${
                    activeTab === 'site'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Site Status
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`inline-block p-4 ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`inline-block p-4 ${
                    activeTab === 'password'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Site Status Tab */}
            {activeTab === 'site' && (
              <div>
                <div className="mb-6">
                  <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                    <h3 className="font-medium mb-2">About Site Status</h3>
                    <p className="text-sm mb-2">You can set your e-commerce site to maintenance mode to temporarily prevent customers from placing orders while you make updates.</p>
                    <p className="text-sm">When in maintenance mode, customers will see a maintenance message instead of your store content.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-4 h-4 rounded-full ${siteStatus.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <h3 className="text-lg font-medium">
                        {siteStatus.active ? 'Site is ACTIVE' : 'Site is in MAINTENANCE MODE'}
                      </h3>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Maintenance Message:</label>
                      <textarea
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        disabled={siteStatus.active}
                        placeholder="Message to display when site is in maintenance mode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={handleToggleSiteStatus}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded ${
                        siteStatus.active 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isLoading ? 'Updating...' : (siteStatus.active ? 'Enable Maintenance Mode' : 'Activate Site')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <Input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <Input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isFormLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isFormLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <Input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isFormLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isFormLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 