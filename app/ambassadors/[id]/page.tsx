'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/app/sections/nav';
import { 
  DarkModePanel, 
  DarkModeInput, 
  DarkModeButton, 
  DarkModeText, 
  DarkModeStatus,
  DarkModeTable,
  DarkModeTableHeader,
  DarkModeTableRow,
  DarkModeTableCell,
  DarkModeLabel
} from '@/app/components/ui/dark-mode-wrapper';

// Types for our ambassador data
interface Ambassador {
  _id: string;
  name: string;
  email: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  referralCode: string;
  referralLink: string;
  couponCode: string;
  discountPercent: number;
  commissionRate: number;
  reason: string;
  sales: number;
  earnings: number;
  referrals: number;
  orders: number;
  conversions: number;
  paymentsPending: number;
  paymentsPaid: number;
  productVideoLink?: string;
  videoSubmissionDate?: string;
  recentOrders: {
    orderId: string;
    orderDate: string;
    amount: number;
    commission: number;
    isPaid: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  application?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
    otherSocialMedia?: string;
    personalStyle?: string;
    soldBefore?: string;
    promotionPlan?: string;
    investmentOption?: string;
    contentComfort?: string;
    instagramFollowers?: string;
    tiktokFollowers?: string;
    otherFollowers?: string;
    targetAudience?: string;
    otherAudience?: string;
    motivation?: string;
    hasCamera?: string;
    attendEvents?: string;
    additionalInfo?: string;
    questions?: string;
  };
}

export default function AmbassadorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    status: '',
    commissionRate: 0,
    couponCode: '',
    discountPercent: 0,
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchAmbassador();
    }
  }, [id]);

  const fetchAmbassador = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ambassadors/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambassador details');
      }
      
      const data = await response.json();
      setAmbassador(data.ambassador);
      
      // Set form data initial values
      setFormData({
        status: data.ambassador.status,
        commissionRate: data.ambassador.commissionRate, // Keep as percentage (no conversion needed)
        couponCode: data.ambassador.couponCode || '',
        discountPercent: data.ambassador.discountPercent || 10,
      });
    } catch (err) {
      console.error('Error fetching ambassador details:', err);
      setError('Failed to load ambassador details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'commissionRate' || name === 'discountPercent' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Keep commission rate as percentage for storage (20% = 20, not 0.2)
      const updateData = {
        ...formData,
        commissionRate: formData.commissionRate,
      };
      
      const response = await fetch(`/api/ambassadors/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ambassador');
      }
      
      const data = await response.json();
      setAmbassador(data.ambassador);
      setIsEditing(false);
      setSuccessMessage('Ambassador details updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating ambassador:', err);
      setError('Failed to update ambassador. Please try again.');
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleBulkPaymentUpdate = async (status: 'paid' | 'waiting') => {
    if (!ambassador) return;

    try {
      const response = await fetch(`/api/ambassadors/${id}/payments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payments');
      }

      const data = await response.json();
      setAmbassador(data.ambassador);
      setSuccessMessage(`All payments marked as ${status === 'paid' ? 'paid' : 'waiting'}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating payments:', err);
      setError('Failed to update payments. Please try again.');
    }
  };

  const handleOrderPaymentUpdate = async (orderId: string, isPaid: boolean) => {
    if (!ambassador) return;

    try {
      const response = await fetch(`/api/ambassadors/${id}/payments/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPaid }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      const data = await response.json();
      setAmbassador(data.ambassador);
      setSuccessMessage(`Payment status updated successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Failed to update payment status. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-black overflow-x-hidden">
      <Nav />
      <main className="flex-1 p-2 sm:p-4 lg:p-8 bg-background dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <div className="mb-4 sm:mb-6">
            <Link 
              href="/ambassadors"
              className="inline-flex items-center text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Ambassadors
            </Link>
          </div>

          {/* Enhanced Page title with Dashboard-style font - FIXED for mobile */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white break-words"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Ambassador Details
            </h1>
            <div className="h-1 w-12 sm:w-16 md:w-24 lg:w-32 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-4 sm:mb-6">
            {!isEditing && ambassador && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-blue-500"
              >
                Edit Details
              </button>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-3 sm:p-4 mb-4 sm:mb-6 mx-2 sm:mx-0">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Success message */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-600 p-3 sm:p-4 mb-4 sm:mb-6 mx-2 sm:mx-0">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center py-8 sm:py-12">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-700 dark:text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : ambassador ? (
            <DarkModePanel className="shadow rounded-lg overflow-hidden mx-2 sm:mx-0">
              {/* Edit form */}
              {isEditing ? (
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Ambassador Details</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">
                      <div>
                        <DarkModeLabel htmlFor="status">
                          Status
                        </DarkModeLabel>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div>
                        <DarkModeLabel htmlFor="commissionRate">
                          Commission Rate (%)
                        </DarkModeLabel>
                        <DarkModeInput
                          type="number"
                          id="commissionRate"
                          name="commissionRate"
                          step="0.1"
                          min="0"
                          max="50"
                          value={formData.commissionRate}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <DarkModeLabel htmlFor="couponCode">
                          Coupon Code
                        </DarkModeLabel>
                        <DarkModeInput
                          type="text"
                          id="couponCode"
                          name="couponCode"
                          value={formData.couponCode}
                          onChange={handleInputChange}
                          placeholder="Custom coupon code"
                          className="text-sm sm:text-base"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                          Leave empty to use default referral code
                        </p>
                      </div>
                      
                      <div>
                        <DarkModeLabel htmlFor="discountPercent">
                          Discount Percentage (%)
                        </DarkModeLabel>
                        <DarkModeInput
                          type="number"
                          id="discountPercent"
                          name="discountPercent"
                          step="1"
                          min="0"
                          max="100"
                          value={formData.discountPercent}
                          onChange={handleInputChange}
                          className="text-sm sm:text-base"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                          Discount applied when customers use this coupon code
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <DarkModeButton
                        type="submit"
                        variant="primary"
                        className="w-full sm:w-auto"
                      >
                        Save Changes
                      </DarkModeButton>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            status: ambassador.status,
                            commissionRate: ambassador.commissionRate * 100,
                            couponCode: ambassador.couponCode || '',
                            discountPercent: ambassador.discountPercent || 10,
                          });
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-white/30"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {/* Ambassador details */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start">
                      <div className="flex-1 mb-3 sm:mb-0 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white break-words">{ambassador.name}</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-white/70 break-all overflow-hidden">{ambassador.email}</p>
                      </div>
                      <div className="self-start sm:self-center flex-shrink-0">
                        <DarkModeStatus
                          status={ambassador.status === 'approved' ? 'success' : ambassador.status === 'rejected' ? 'error' : 'warning'}
                        >
                          {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                        </DarkModeStatus>
                      </div>
                    </div>
                  </div>
                  
                  {/* Basic information */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">User ID</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all overflow-hidden">{ambassador.userId}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Application Date</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(ambassador.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Last Updated</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(ambassador.updatedAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Commission Rate</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.commissionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Application reason */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">Reason for Application</h3>
                    <div className="bg-gray-50 dark:bg-black/40 p-3 sm:p-4 rounded-md text-sm text-gray-700 dark:text-white/90 break-words overflow-hidden">
                      {ambassador.reason}
                    </div>
                  </div>
                  
                  {/* 🔗 ADMIN LINKS MANAGEMENT TABLE */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                      🔗 Admin Links Management
                    </h3>
                    
                    {/* Professional Links Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Link Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Code/Link
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Details
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Referral Code Row */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Referral Code</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">For tracking referrals</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <code className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                {ambassador.referralCode || 'Not generated yet'}
                              </code>
                            </td>
                                                         <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                               Commission: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{ambassador.commissionRate.toFixed(1)}%</span>
                             </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => navigator.clipboard.writeText(ambassador.referralCode || '')}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                              >
                                Copy
                              </button>
                            </td>
                          </tr>

                          {/* Coupon Code Row */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Coupon Code</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">For customer discounts</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <code className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                {ambassador.couponCode || ambassador.referralCode || 'Not generated yet'}
                              </code>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                              Discount: <span className="font-semibold text-blue-600 dark:text-blue-400">{ambassador.discountPercent}%</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => navigator.clipboard.writeText(ambassador.couponCode || ambassador.referralCode || '')}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                              >
                                Copy
                              </button>
                            </td>
                          </tr>



                          {/* Video Link Row (if exists) */}
                          {ambassador.productVideoLink && (
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">Video Content</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Product showcase video</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="max-w-xs">
                                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white break-all">
                                    {ambassador.productVideoLink}
                                  </code>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {ambassador.videoSubmissionDate && `Submitted: ${formatDate(ambassador.videoSubmissionDate)}`}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => navigator.clipboard.writeText(ambassador.productVideoLink || '')}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={() => window.open(ambassador.productVideoLink, '_blank')}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Watch
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Actions for All Links */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const allLinks = [
                              `Referral Code: ${ambassador.referralCode}`,
                              `Coupon Code: ${ambassador.couponCode || ambassador.referralCode}`,
                              ambassador.productVideoLink ? `Video: ${ambassador.productVideoLink}` : null
                            ].filter(Boolean).join('\n');
                            navigator.clipboard.writeText(allLinks);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-black hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          📋 Copy All Codes
                        </button>
                        {ambassador.productVideoLink && (
                          <button
                            onClick={() => window.open(ambassador.productVideoLink, '_blank')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                          >
                            🎥 Watch Video
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 📤 AMBASSADOR SUBMITTED LINKS */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                      📤 Links Submitted by Ambassador
                    </h3>
                    
                    {(ambassador.productVideoLink || ambassador.application?.instagramHandle || ambassador.application?.tiktokHandle) ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Content Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Link/Handle
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Product Video Link */}
                            {ambassador.productVideoLink && (
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">Product Video</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {ambassador.videoSubmissionDate ? formatDate(ambassador.videoSubmissionDate) : 'Recently submitted'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="max-w-xs">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white break-all">
                                      {ambassador.productVideoLink}
                                    </code>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    ✅ Submitted
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(ambassador.productVideoLink || '')}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => window.open(ambassador.productVideoLink, '_blank')}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    Watch
                                  </button>
                                </td>
                              </tr>
                            )}

                            {/* Instagram Handle */}
                            {ambassador.application?.instagramHandle && (
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM12.017 7.754c2.313 0 4.188 1.875 4.188 4.188 0 2.313-1.875 4.188-4.188 4.188s-4.188-1.875-4.188-4.188c0-2.313 1.875-4.188 4.188-4.188zM12.017 2.138c3.758 0 6.804 3.046 6.804 6.804 0 3.758-3.046 6.804-6.804 6.804s-6.804-3.046-6.804-6.804c0-3.758 3.046-6.804 6.804-6.804z"/>
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">Instagram</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">Social media handle</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <code className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                    @{ambassador.application.instagramHandle}
                                  </code>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    📱 Active
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(`@${ambassador.application?.instagramHandle}` || '')}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://instagram.com/${ambassador.application?.instagramHandle}`, '_blank')}
                                    className="text-pink-600 hover:text-pink-900 dark:text-pink-400 dark:hover:text-pink-300"
                                  >
                                    Visit
                                  </button>
                                </td>
                              </tr>
                            )}

                            {/* TikTok Handle */}
                            {ambassador.application?.tiktokHandle && (
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      <div className="h-8 w-8 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">TikTok</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">Social media handle</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <code className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                    @{ambassador.application.tiktokHandle}
                                  </code>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                    🎬 Active
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(`@${ambassador.application?.tiktokHandle}` || '')}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://tiktok.com/@${ambassador.application?.tiktokHandle}`, '_blank')}
                                    className="text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
                                  >
                                    Visit
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No links submitted yet</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This ambassador hasn't submitted any content links yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Performance metrics - REMOVED conversion rate */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Sales</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(ambassador.sales || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Earnings</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(ambassador.earnings || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Referrals</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{ambassador.referrals || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Orders</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{ambassador.orders || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video Link Section */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Product Video Content</h3>
                    {ambassador.productVideoLink ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Video Link</div>
                          <div className="mt-1">
                            <a 
                              href={ambassador.productVideoLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all text-sm overflow-hidden"
                            >
                              {ambassador.productVideoLink}
                            </a>
                          </div>
                        </div>
                        {ambassador.videoSubmissionDate && (
                          <div>
                            <div className="text-sm font-medium text-gray-500 dark:text-white/70">Submission Date</div>
                            <div className="mt-1 text-sm text-gray-900 dark:text-white">
                              {formatDate(ambassador.videoSubmissionDate)}
                            </div>
                          </div>
                        )}
                        <div>
                          <button 
                            onClick={() => window.open(ambassador.productVideoLink, '_blank')}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            View Video Content
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-white/70 italic">
                        No video content submitted yet.
                      </div>
                    )}
                  </div>
                  
                  {/* Payment information */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Payment Management</h3>
                    
                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Total Earnings</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(ambassador.earnings || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Pending Payments</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(ambassador.paymentsPending || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Paid Out</div>
                        <div className="mt-1 text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(ambassador.paymentsPaid || 0)}</div>
                      </div>
                    </div>

                    {/* Quick Payment Actions */}
                    <div className="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Payment Actions</h4>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <button
                          onClick={() => handleBulkPaymentUpdate('paid')}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Mark All Pending as Paid
                        </button>
                        <button
                          onClick={() => handleBulkPaymentUpdate('waiting')}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          Mark All as Waiting
                        </button>
                      </div>
                    </div>

                    {/* Individual Order Payments */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Individual Orders</h4>
                      {ambassador.recentOrders && ambassador.recentOrders.length > 0 ? (
                        <div className="space-y-3">
                          {ambassador.recentOrders.map((order, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        Order #{order.orderId}
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-500 dark:text-white/70">
                                        {formatDate(order.orderDate)} • {formatCurrency(order.amount)} sale
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(order.commission)} commission
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end space-x-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.isPaid 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  }`}>
                                    {order.isPaid ? 'Paid' : 'Pending'}
                                  </span>
                                  <select
                                    value={order.isPaid ? 'paid' : 'pending'}
                                    onChange={(e) => handleOrderPaymentUpdate(order.orderId, e.target.value === 'paid')}
                                    className="text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="waiting">Waiting</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-white/70 italic">
                          No orders found for this ambassador.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Application Details */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Application Details</h3>
                    {ambassador.application ? (
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Full Name</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.fullName || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Phone Number</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-all overflow-hidden">{ambassador.application.phoneNumber || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Email</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-all overflow-hidden">{ambassador.application.email || ambassador.email}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Handle</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">
                            {ambassador.application.instagramHandle ? (
                              <a 
                                href={`https://instagram.com/${ambassador.application.instagramHandle.replace('@', '')}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all overflow-hidden"
                              >
                                {ambassador.application.instagramHandle}
                              </a>
                            ) : 'Not provided'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">TikTok Handle</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">
                            {ambassador.application.tiktokHandle ? (
                              <a 
                                href={`https://tiktok.com/@${ambassador.application.tiktokHandle.replace('@', '')}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all overflow-hidden"
                              >
                                {ambassador.application.tiktokHandle}
                              </a>
                            ) : 'Not provided'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Social Media</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.otherSocialMedia || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Personal Style</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.personalStyle || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Sold Products Before</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.soldBefore || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">How They Plan to Promote</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.promotionPlan || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Investment Option</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.investmentOption || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Content Creation Comfort</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.contentComfort || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.instagramFollowers || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">TikTok Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.tiktokFollowers || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Platform Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.otherFollowers || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Target Audience</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.targetAudience || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Audience Details</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.otherAudience || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Motivation</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.motivation || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Has Camera Equipment</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.hasCamera || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Can Attend Events</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.attendEvents || 'Not provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Additional Information</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.additionalInfo || 'None provided'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Questions</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application.questions || 'None provided'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-white/70 italic">No detailed application information available.</div>
                    )}
                  </div>
                  
                  {/* Recent orders */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5">
                    <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Recent Orders</h3>
                    {ambassador.recentOrders && ambassador.recentOrders.length > 0 ? (
                      <div className="space-y-3 sm:space-y-0">
                        {/* Mobile-first card layout */}
                        <div className="block sm:hidden space-y-3">
                          {ambassador.recentOrders.map((order, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800/50">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      Order #{order.orderId}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-white/70">
                                      {formatDate(order.orderDate)}
                                    </div>
                                  </div>
                                  <DarkModeStatus status={order.isPaid ? 'success' : 'warning'}>
                                    {order.isPaid ? 'Paid' : 'Pending'}
                                  </DarkModeStatus>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 dark:text-white/70">Amount:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 dark:text-white/70">Commission:</span>
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(order.commission)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Desktop table layout */}
                        <div className="hidden sm:block overflow-x-auto">
                          <DarkModeTable>
                            <DarkModeTableHeader>
                              <tr>
                                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                  Order ID
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                  Commission
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </DarkModeTableHeader>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {ambassador.recentOrders.map((order, index) => (
                                <DarkModeTableRow key={index}>
                                  <DarkModeTableCell className="whitespace-nowrap font-medium px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">{order.orderId}</DarkModeTableCell>
                                  <DarkModeTableCell className="whitespace-nowrap px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">{formatDate(order.orderDate)}</DarkModeTableCell>
                                  <DarkModeTableCell className="whitespace-nowrap px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">{formatCurrency(order.amount)}</DarkModeTableCell>
                                  <DarkModeTableCell className="whitespace-nowrap px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm">{formatCurrency(order.commission)}</DarkModeTableCell>
                                  <DarkModeTableCell className="whitespace-nowrap px-3 sm:px-6 py-2 sm:py-4">
                                    <DarkModeStatus status={order.isPaid ? 'success' : 'warning'}>
                                      {order.isPaid ? 'Paid' : 'Pending'}
                                    </DarkModeStatus>
                                  </DarkModeTableCell>
                                </DarkModeTableRow>
                              ))}
                            </tbody>
                          </DarkModeTable>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-white/70">No orders recorded yet.</p>
                    )}
                  </div>
                </>
              )}
            </DarkModePanel>
          ) : (
            <DarkModePanel className="p-6 sm:p-8 text-center mx-2 sm:mx-0">
              <p className="text-gray-500 dark:text-white/70 text-base sm:text-lg">Ambassador not found.</p>
            </DarkModePanel>
          )}
        </div>
      </main>
    </div>
  );
} 