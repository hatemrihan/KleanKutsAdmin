'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Nav from '../../sections/nav';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '../../components/ui/alert-dialog';

interface Subscriber {
  _id: string;
  email: string;
  source: string;
  subscribed: boolean;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function NewsletterAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSubscribers();
  }, [pagination.page, sourceFilter, statusFilter, searchQuery]);

  useEffect(() => {
    // Add click-outside handler for the export dropdown
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (sourceFilter && sourceFilter !== 'all') {
        params.append('source', sourceFilter);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('subscribed', statusFilter);
      }
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await axios.get(`/api/newsletter/subscribers?${params.toString()}`);
      setSubscribers(response.data.subscribers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const exportSubscribers = async (format: 'txt' | 'csv') => {
    try {
      const payload = {
        format,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        subscribed: statusFilter === 'true' ? true : statusFilter === 'false' ? false : undefined
      };
      
      // For both formats, we need to handle it as a blob download
        const response = await axios.post('/api/newsletter/subscribers', payload, {
        responseType: 'blob'
        });
        
        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
      link.setAttribute('download', `newsletter_subscribers.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      toast.error('Failed to export subscribers');
    }
  };

  const handleUnsubscribe = async (email: string) => {
    try {
      await axios.post('/api/newsletter/unsubscribe', { email });
      toast.success('Subscriber unsubscribed successfully');
      fetchSubscribers();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe');
    }
  };

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'website_footer', label: 'Website Footer' },
    { value: 'popup', label: 'Popup' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'other', label: 'Other' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'true', label: 'Subscribed' },
    { value: 'false', label: 'Unsubscribed' }
  ];

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (isLoading && subscribers.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Nav />
        <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-white" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-2 sm:p-4 lg:p-8 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Page title with Dashboard-style font */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Subscribers
            </h1>
            <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4 mx-2 sm:mx-0">
            <div>
              <p className="text-gray-500 dark:text-white dark:opacity-70 mt-1 text-sm sm:text-base">Manage your newsletter subscribers</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Input
                  type="search"
                  placeholder="Search emails..."
                  className="pl-10 w-full dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:placeholder-white dark:placeholder-opacity-50 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-white dark:opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-[150px] dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white text-sm sm:text-base">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="dark:bg-black dark:border-white dark:border-opacity-20">
                  {sources.map((source) => (
                    <SelectItem key={source.value} value={source.value} className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white text-sm sm:text-base">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-black dark:border-white dark:border-opacity-20">
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="dropdown relative" ref={exportDropdownRef}>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 text-sm sm:text-base"
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                >
                  Export
                  <svg className={`ml-2 w-3 h-3 sm:w-4 sm:h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                {exportDropdownOpen && (
                  <div className="dropdown-content absolute right-0 mt-2 w-48 bg-white dark:bg-black shadow-lg rounded-md border dark:border-white dark:border-opacity-20 z-10">
                    <button 
                      onClick={() => {
                        exportSubscribers('txt');
                        setExportDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10"
                    >
                      Export as TXT
                    </button>
                    <button 
                      onClick={() => {
                        exportSubscribers('csv');
                        setExportDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10"
                    >
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden border dark:border-white dark:border-opacity-20 mx-2 sm:mx-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white dark:divide-opacity-20">
                <thead>
                  <tr>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Email</th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden sm:table-cell">Source</th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden md:table-cell">Date Subscribed</th>
                    <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white dark:divide-opacity-20">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 sm:px-3 lg:px-6 py-4 text-center text-gray-500 dark:text-white dark:opacity-70 text-sm">
                        No subscribers found.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((subscriber) => (
                      <tr key={subscriber._id} className="hover:bg-gray-50 dark:hover:bg-white dark:hover:bg-opacity-5">
                        <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none break-all">{subscriber.email}</div>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-white dark:opacity-70">
                            {subscriber.source === 'website_footer' ? 'Website Footer' :
                             subscriber.source === 'popup' ? 'Popup' :
                             subscriber.source === 'checkout' ? 'Checkout' : 
                             subscriber.source || 'Other'}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subscriber.subscribed
                              ? 'bg-green-100 text-green-800 dark:bg-white dark:bg-opacity-10 dark:text-white'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300'
                          }`}>
                            {subscriber.subscribed ? 'Subscribed' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-white dark:opacity-70 hidden md:table-cell">
                          {new Date(subscriber.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          {subscriber.subscribed && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                                 Remove
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="dark:text-white">Remove Confirmation</AlertDialogTitle>
                                  <AlertDialogDescription className="dark:text-white dark:opacity-70 break-words">
                                    Are you sure you want to Remove {subscriber.email}? They will no longer receive newsletter emails.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                  <AlertDialogCancel className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleUnsubscribe(subscriber.email)}
                                    className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto"
                                  >
                                   Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 gap-3 sm:gap-0 mx-2 sm:mx-0">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-white dark:opacity-70 text-center sm:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} subscribers
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 disabled:dark:opacity-30 flex-1 sm:flex-none text-sm"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 disabled:dark:opacity-30 flex-1 sm:flex-none text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
