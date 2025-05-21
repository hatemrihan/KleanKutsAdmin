'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Nav from '@/app/sections/nav';
import { DarkModePanel, DarkModeInput, DarkModeStatus, DarkModeText } from '@/app/components/ui/dark-mode-wrapper';

// Types for our ambassador data
interface Ambassador {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  referralCode?: string;
  referralLink?: string;
  couponCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  commissionRate: number;
  ordersCount?: number;
  totalEarnings?: number;
  sales?: number;
  earnings?: number;
  paymentsPending?: number;
  paymentsPaid?: number;
  referrals?: number;
  orders?: number;
  conversions?: number;
  createdAt?: Date;
}

export default function AmbassadorsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/ambassadors');
      
      // Extract the ambassadors data from the response
      if (response.data && response.data.ambassadors) {
        setAmbassadors(response.data.ambassadors);
        
        if (response.data.ambassadors.length === 0) {
          console.log('No ambassadors found in the database');
        } else {
          console.log(`Found ${response.data.ambassadors.length} ambassadors`);
        }
      } else {
        console.error('API did not return ambassadors data:', response.data);
        setAmbassadors([]);
        toast.error('Invalid data format received from server');
      }
      setError('');
    } catch (err) {
      console.error('Error fetching ambassadors:', err);
      setError('Failed to load ambassadors. Please ensure your database connection is configured correctly.');
      toast.error('Failed to load ambassadors');
      setAmbassadors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Only show confirmation for deactivation
      if (currentStatus && !confirm('Are you sure you want to deactivate this ambassador?')) {
        return;
      }
      
      setIsLoading(true);
      
      const response = await axios.patch(`/api/ambassadors/${id}`, { isActive: !currentStatus });
      
      if (response.data.success) {
        toast.success(`Ambassador ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        
        // Refresh the ambassador list
        fetchAmbassadors();
        
        // Add extra logging to help with debugging
        console.log(`Ambassador ${id} status toggled from ${currentStatus ? 'active' : 'inactive'} to ${!currentStatus ? 'active' : 'inactive'}`);
        
        // Add a small delay to make sure the database update completes
        setTimeout(() => {
          // Notify the e-commerce store to update its coupon cache
          try {
            // This is an optional ping to the store to refresh its coupon data
            // It's fine if this fails or if the endpoint doesn't exist
            fetch(process.env.NEXT_PUBLIC_STORE_URL + '/api/hooks/refresh-coupons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Admin-Auth': process.env.NEXT_PUBLIC_ADMIN_API_KEY || ''
              },
              body: JSON.stringify({ 
                trigger: 'ambassador_toggle',
                ambassadorId: id, 
                isActive: !currentStatus 
              })
            }).catch(e => console.log('Store notification optional, can safely ignore:', e));
          } catch (notifyErr) {
            // Ignore errors from this optional enhancement
            console.log('Store notification is optional, not critical for functionality');
          }
        }, 1000);
      } else {
        toast.error(response.data.error || 'Failed to update ambassador status');
      }
    } catch (err) {
      console.error('Error toggling ambassador status:', err);
      toast.error('Failed to update ambassador status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAmbassador = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to approve this ambassador?')) {
        return;
      }
      
      setIsLoading(true);
      
      const response = await axios.patch(`/api/ambassadors/${id}`, { 
        status: 'approved'
      });
      
      if (response.data.success) {
        toast.success('Ambassador approved successfully');
        fetchAmbassadors(); // Refresh the entire list
      } else {
        toast.error(response.data.error || 'Failed to approve ambassador');
      }
    } catch (err) {
      console.error('Error approving ambassador:', err);
      toast.error('Failed to approve ambassador');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRejectAmbassador = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to reject this ambassador?')) {
        return;
      }
      
      setIsLoading(true);
      
      const response = await axios.patch(`/api/ambassadors/${id}`, { 
        status: 'rejected'
      });
      
      if (response.data.success) {
        toast.success('Ambassador rejected successfully');
        fetchAmbassadors(); // Refresh the entire list
      } else {
        toast.error(response.data.error || 'Failed to reject ambassador');
      }
    } catch (err) {
      console.error('Error rejecting ambassador:', err);
      toast.error('Failed to reject ambassador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ambassador?')) return;
    
    try {
      await axios.delete(`/api/ambassadors/${id}`);
      toast.success('Ambassador deleted successfully');
      fetchAmbassadors();
    } catch (err) {
      console.error('Error deleting ambassador:', err);
      toast.error('Failed to delete ambassador');
    }
  };

  // Safely compute filtered ambassadors, always ensuring it's an array
  const filteredAmbassadors = React.useMemo(() => {
    if (!Array.isArray(ambassadors)) return [];
    
    return searchQuery
      ? ambassadors.filter(
          ambassador =>
            ambassador.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ambassador.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ambassador.phone && ambassador.phone.includes(searchQuery))
        )
      : ambassadors;
  }, [ambassadors, searchQuery]);
  
  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8 bg-background dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">Ambassadors</h1>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
              <DarkModeInput
                type="search"
                placeholder="Search ambassadors..."
                className="w-full sm:w-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Link
                href="/ambassadors/new"
                className="bg-black hover:bg-gray-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-medium py-2 px-4 rounded text-center flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Ambassador
              </Link>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
          ) : ambassadors.length === 0 ? (
            <DarkModePanel className="rounded-lg shadow-sm p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No ambassadors found</h3>
              <p className="mt-1 text-gray-500 dark:text-white/70">Get started by adding your first ambassador</p>
              <Link href="/ambassadors/new" className="mt-6 inline-block">
                <button className="bg-black hover:bg-gray-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-medium py-2 px-4 rounded flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Ambassador
                </button>
              </Link>
            </DarkModePanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.isArray(filteredAmbassadors) && filteredAmbassadors.map((ambassador: Ambassador) => (
                <DarkModePanel key={ambassador._id} className="rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                          {ambassador.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">{ambassador.name}</h3>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-white/70">{ambassador.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-1 mt-2 sm:mt-0">
                        <DarkModeStatus
                          status={ambassador.status === 'approved' ? 'success' : ambassador.status === 'rejected' ? 'error' : 'warning'}
                          className="text-xs"
                        >
                          {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                        </DarkModeStatus>
                        <DarkModeStatus
                          status={(ambassador.isActive === undefined || ambassador.isActive) ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {(ambassador.isActive === undefined || ambassador.isActive) ? 'Active' : 'Inactive'}
                        </DarkModeStatus>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-4">
                      <div className="text-xs md:text-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500 dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-700 dark:text-white/90 text-xs md:text-sm">{ambassador.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500 dark:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-blue-600 dark:text-blue-400 text-xs md:text-sm">{ambassador.code}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <DarkModeText className="text-xs md:text-sm">Commission Rate:</DarkModeText>
                        <span className="text-xs md:text-sm font-semibold text-emerald-600 dark:text-emerald-400">{ambassador.commissionRate}%</span>
                      </div>
                      
                      <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-gray-200 dark:border-white/10">
                        <div className="font-medium mb-2 text-sm md:text-base text-gray-900 dark:text-white">Performance</div>
                        <div className="flex gap-4 md:gap-6">
                          <div>
                            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{ambassador.ordersCount || 0}</div>
                            <div className="text-xs text-gray-500 dark:text-white/70">Total Orders</div>
                          </div>
                          <div>
                            <div className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">L.E. {(ambassador.totalEarnings || 0).toFixed(2)}</div>
                            <div className="text-xs text-gray-500 dark:text-white/70">Total Earnings</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-6 flex flex-wrap justify-end gap-2 md:gap-3">
                      {ambassador.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveAmbassador(ambassador._id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs md:text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectAmbassador(ambassador._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs md:text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleToggleActive(ambassador._id, ambassador.isActive === undefined ? true : ambassador.isActive)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs md:text-sm font-medium"
                      >
                        {(ambassador.isActive === undefined || ambassador.isActive) ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link 
                        href={`/ambassadors/${ambassador._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs md:text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(ambassador._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs md:text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </DarkModePanel>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 