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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/ambassadors"
            className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Ambassadors
          </Link>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Ambassador Details
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage ambassador information and commission settings
          </p>
        </div>

        {/* Edit button */}
        <div className="mb-6">
          {!isEditing && ambassador && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Edit Details
            </button>
          )}
        </div>
        
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : ambassador ? (
          <div className="space-y-6">
            {/* Edit Form */}
            {isEditing ? (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Edit Ambassador Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update ambassador settings and commission rates
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    {/* Commission Rate */}
                    <div>
                      <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Commission Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="commissionRate"
                          name="commissionRate"
                          step="0.1"
                          min="0"
                          max="50"
                          value={formData.commissionRate}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-8 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500 dark:text-gray-400">%</span>
                      </div>
                    </div>
                    
                    {/* Coupon Code */}
                    <div>
                      <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        id="couponCode"
                        name="couponCode"
                        value={formData.couponCode}
                        onChange={handleInputChange}
                        placeholder="Enter custom coupon code"
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white font-mono"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Leave empty to auto-generate from referral code
                      </p>
                    </div>
                    
                    {/* Discount Percentage */}
                    <div>
                      <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Customer Discount (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="discountPercent"
                          name="discountPercent"
                          step="1"
                          min="0"
                          max="100"
                          value={formData.discountPercent}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 pr-8 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Discount customers get when using this coupon
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          status: ambassador.status,
                          commissionRate: ambassador.commissionRate,
                          couponCode: ambassador.couponCode || '',
                          discountPercent: ambassador.discountPercent || 10,
                        });
                      }}
                      className="inline-flex justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Ambassador Header */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {ambassador.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {ambassador.name}
                          </h1>
                          <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                            {ambassador.email}
                          </p>
                          <div className="mt-1 flex items-center space-x-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              ID: {ambassador.userId}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {ambassador.commissionRate}% Commission
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          ambassador.status === 'approved' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : ambassador.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Performance Stats */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Performance Overview
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          ${ambassador.sales || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          ${ambassador.earnings || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {ambassador.orders || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {ambassador.referrals || 0}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Referrals</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Date</div>
                        <div className="text-sm text-gray-900 dark:text-white">{formatDate(ambassador.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</div>
                        <div className="text-sm text-gray-900 dark:text-white">{formatDate(ambassador.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Application Reason */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Application Reason
                    </h2>
                  </div>
                  <div className="p-6">
                    <blockquote className="text-gray-700 dark:text-gray-300 italic">
                      "{ambassador.reason}"
                    </blockquote>
                  </div>
                </div>
                
                {/* Links Management */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Links Management
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Code/Link
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Referral Code</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">For tracking referrals</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded">
                              {ambassador.referralCode || 'Not generated yet'}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            Commission: <span className="font-medium text-green-600 dark:text-green-400">{ambassador.commissionRate.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigator.clipboard.writeText(ambassador.referralCode || '')}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Coupon Code</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">For customer discounts</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded">
                              {ambassador.couponCode || ambassador.referralCode || 'Not available'}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            Discount: <span className="font-medium text-green-600 dark:text-green-400">{ambassador.discountPercent || 10}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigator.clipboard.writeText(ambassador.couponCode || ambassador.referralCode || '')}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product Video Link */}
                {ambassador.productVideoLink && (
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Product Video Link
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
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
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Payment Management
                    </h2>
                  </div>
                  <div className="p-6">
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
                </div>

                {/* Application Details */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Application Details
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Full Name</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.fullName || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Phone Number</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-all overflow-hidden">{ambassador.application?.phoneNumber || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Email</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-all overflow-hidden">{ambassador.application?.email || ambassador.email}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Handle</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">
                          {ambassador.application?.instagramHandle ? (
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
                          {ambassador.application?.tiktokHandle ? (
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
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.otherSocialMedia || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Personal Style</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.personalStyle || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Sold Products Before</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.soldBefore || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">How They Plan to Promote</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.promotionPlan || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Investment Option</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.investmentOption || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Content Creation Comfort</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.contentComfort || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Followers</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.instagramFollowers || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">TikTok Followers</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.tiktokFollowers || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Platform Followers</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.otherFollowers || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Target Audience</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.targetAudience || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Audience Details</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.otherAudience || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Motivation</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.motivation || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Has Camera Equipment</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.hasCamera || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Can Attend Events</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.attendEvents || 'Not provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Additional Information</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.additionalInfo || 'None provided'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Questions</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white break-words overflow-hidden">{ambassador.application?.questions || 'None provided'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Recent Orders
                    </h2>
                  </div>
                  <div className="p-6">
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
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <DarkModePanel className="p-6 sm:p-8 text-center mx-2 sm:mx-0">
            <p className="text-gray-500 dark:text-white/70 text-base sm:text-lg">Ambassador not found.</p>
          </DarkModePanel>
        )}
      </main>
    </div>
  );
} 