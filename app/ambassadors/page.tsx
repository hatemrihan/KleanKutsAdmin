'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '@/app/sections/nav';

// Types for our ambassador data
interface Ambassador {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  referralCode: string;
  sales: number;
  earnings: number;
  referrals: number;
  createdAt: string;
}

export default function AmbassadorsPage() {
  const router = useRouter();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAmbassadors(activeTab);
  }, [activeTab]);

  const fetchAmbassadors = async (tab: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statusParam = tab !== 'all' ? `?status=${tab}` : '';
      const response = await fetch(`/api/ambassadors${statusParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ambassadors');
      }
      
      const data = await response.json();
      setAmbassadors(data.ambassadors || []);
    } catch (err) {
      console.error('Error fetching ambassadors:', err);
      setError('Failed to load ambassadors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/ambassadors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ambassador status');
      }
      
      // Refresh the list after update
      fetchAmbassadors(activeTab);
    } catch (err) {
      console.error('Error updating ambassador status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Ambassador Program
            </h1>
            <div className="mt-3 sm:mt-0">
              <a 
                href="https://elevee.netlify.app/become-ambassador" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                View Application Form
              </a>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6 bg-gray-100 p-1 rounded-md flex flex-wrap">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeTab === 'all' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              All Ambassadors
            </button>
            <button 
              onClick={() => setActiveTab('pending')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeTab === 'pending' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Pending Requests
            </button>
            <button 
              onClick={() => setActiveTab('approved')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeTab === 'approved' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Approved
            </button>
            <button 
              onClick={() => setActiveTab('rejected')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeTab === 'rejected' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Rejected
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500 text-lg">
                {activeTab === 'all' 
                  ? 'No ambassadors found.' 
                  : `No ${activeTab} ambassador requests found.`}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Applied
                      </th>
                      {activeTab === 'approved' && (
                        <>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Referral Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                        </>
                      )}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ambassadors.map((ambassador) => (
                      <tr key={ambassador._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{ambassador.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{ambassador.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${ambassador.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              ambassador.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}
                          >
                            {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ambassador.createdAt)}
                        </td>
                        {activeTab === 'approved' && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {ambassador.referralCode || 'N/A'}
                              </code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col text-xs">
                                <span>Sales: {formatCurrency(ambassador.sales || 0)}</span>
                                <span>Earnings: {formatCurrency(ambassador.earnings || 0)}</span>
                                <span>Referrals: {ambassador.referrals || 0}</span>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/ambassadors/${ambassador._id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View Details
                          </Link>
                          
                          {ambassador.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(ambassador._id, 'approved')}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(ambassador._id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 