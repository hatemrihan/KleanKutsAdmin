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
        commissionRate: data.ambassador.commissionRate * 100, // Convert to percentage
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
      // Convert commission rate from percentage to decimal for storage
      const updateData = {
        ...formData,
        commissionRate: formData.commissionRate / 100,
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

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8 bg-background dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
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

          {/* Page title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Ambassador Details
            </h1>
            {!isEditing && ambassador && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-blue-500"
              >
                Edit Details
              </button>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mb-6">
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
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-600 p-4 mb-6">
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
            <div className="flex justify-center py-12">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-700 dark:text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : ambassador ? (
            <DarkModePanel className="shadow rounded-lg overflow-hidden">
              {/* Edit form */}
              {isEditing ? (
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Ambassador Details</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <DarkModeLabel htmlFor="status">
                          Status
                        </DarkModeLabel>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-black dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                          Discount applied when customers use this coupon code
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <DarkModeButton
                        type="submit"
                        variant="primary"
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
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-white/30"
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
                    <div className="px-6 py-5 flex items-start">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{ambassador.name}</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-white/70">{ambassador.email}</p>
                      </div>
                      <div>
                        <DarkModeStatus
                          status={ambassador.status === 'approved' ? 'success' : ambassador.status === 'rejected' ? 'error' : 'warning'}
                        >
                          {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                        </DarkModeStatus>
                      </div>
                    </div>
                  </div>
                  
                  {/* Basic information */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">User ID</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.userId}</div>
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
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{(ambassador.commissionRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Application reason */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">Reason for Application</h3>
                    <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-md text-sm text-gray-700 dark:text-white/90">
                      {ambassador.reason}
                    </div>
                  </div>
                  
                  {/* Referral information */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Referral Information</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Referral Code</div>
                        <div className="mt-1">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {ambassador.referralCode || 'Not generated yet'}
                          </code>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Coupon Code</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {ambassador.couponCode || ambassador.referralCode || 'Not generated yet'}
                          </code>
                          {ambassador.discountPercent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {ambassador.discountPercent}% discount
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Referral Link</div>
                        <div className="mt-1 text-sm text-blue-600 dark:text-blue-400 break-all">
                          <a 
                            href={ambassador.referralLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {ambassador.referralLink || 'Not generated yet'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance metrics */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Sales</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(ambassador.sales || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Earnings</div>
                        <div className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(ambassador.earnings || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Referrals</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{ambassador.referrals || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Orders</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{ambassador.orders || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Conversion Rate</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {ambassador.referrals ? ((ambassador.conversions / ambassador.referrals) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video Link Section - NEW */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Product Video Content</h3>
                    {ambassador.productVideoLink ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Video Link</div>
                          <div className="mt-1">
                            <a 
                              href={ambassador.productVideoLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
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
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
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
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Pending Payments</div>
                        <div className="mt-1 text-lg font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(ambassador.paymentsPending || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-white/70">Paid Out</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(ambassador.paymentsPaid || 0)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Application Details */}
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Application Details</h3>
                    {ambassador.application ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Full Name</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.fullName || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Phone Number</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.phoneNumber || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Email</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.email || ambassador.email}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Handle</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {ambassador.application.instagramHandle ? (
                              <a 
                                href={`https://instagram.com/${ambassador.application.instagramHandle.replace('@', '')}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {ambassador.application.instagramHandle}
                              </a>
                            ) : 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">TikTok Handle</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            {ambassador.application.tiktokHandle ? (
                              <a 
                                href={`https://tiktok.com/@${ambassador.application.tiktokHandle.replace('@', '')}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {ambassador.application.tiktokHandle}
                              </a>
                            ) : 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Social Media</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.otherSocialMedia || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Personal Style</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.personalStyle || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Sold Products Before</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.soldBefore || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">How They Plan to Promote</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.promotionPlan || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Investment Option</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.investmentOption || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Content Creation Comfort</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.contentComfort || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Instagram Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.instagramFollowers || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">TikTok Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.tiktokFollowers || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Platform Followers</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.otherFollowers || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Target Audience</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.targetAudience || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Other Audience Details</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.otherAudience || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Motivation</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.motivation || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Has Camera Equipment</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.hasCamera || 'Not provided'}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Can Attend Events</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.attendEvents || 'Not provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Additional Information</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.additionalInfo || 'None provided'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm font-medium text-gray-500 dark:text-white/70">Questions</div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">{ambassador.application.questions || 'None provided'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-white/70 italic">No detailed application information available.</div>
                    )}
                  </div>
                  
                  {/* Recent orders */}
                  <div className="px-6 py-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Recent Orders</h3>
                    {ambassador.recentOrders && ambassador.recentOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <DarkModeTable>
                          <DarkModeTableHeader>
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                Amount
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                Commission
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white/70 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </DarkModeTableHeader>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {ambassador.recentOrders.map((order, index) => (
                              <DarkModeTableRow key={index}>
                                <DarkModeTableCell className="whitespace-nowrap font-medium">{order.orderId}</DarkModeTableCell>
                                <DarkModeTableCell className="whitespace-nowrap">{formatDate(order.orderDate)}</DarkModeTableCell>
                                <DarkModeTableCell className="whitespace-nowrap">{formatCurrency(order.amount)}</DarkModeTableCell>
                                <DarkModeTableCell className="whitespace-nowrap">{formatCurrency(order.commission)}</DarkModeTableCell>
                                <DarkModeTableCell className="whitespace-nowrap">
                                  <DarkModeStatus status={order.isPaid ? 'success' : 'warning'}>
                                    {order.isPaid ? 'Paid' : 'Pending'}
                                  </DarkModeStatus>
                                </DarkModeTableCell>
                              </DarkModeTableRow>
                            ))}
                          </tbody>
                        </DarkModeTable>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-white/70">No orders recorded yet.</p>
                    )}
                  </div>
                </>
              )}
            </DarkModePanel>
          ) : (
            <DarkModePanel className="p-8 text-center">
              <p className="text-gray-500 dark:text-white/70 text-lg">Ambassador not found.</p>
            </DarkModePanel>
          )}
        </div>
      </main>
    </div>
  );
} 