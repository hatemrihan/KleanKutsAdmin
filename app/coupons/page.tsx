'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Nav from '../sections/nav';

interface Coupon {
  _id: string;
  code: string;
  discount: number;
  productId: string | null;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New coupon form data
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: 10
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/coupon');
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCoupon.code) {
      toast.error('Promo code is required');
      return;
    }
    
    try {
      setIsCreating(true);
      
      const couponData = {
        ...newCoupon
      };
      
      const response = await axios.post('/api/coupon', couponData);
      
      if (response.data.success) {
        toast.success('Promo code created successfully');
        setNewCoupon({
          code: '',
          discount: 10
        });
        fetchCoupons();
      }
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to create promo code');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      setIsDeleting(true);
      const response = await axios.delete(`/api/coupon?id=${id}`);
      
      if (response.data.success) {
        toast.success('Promo code deleted successfully');
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete promo code');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-2 sm:p-4 lg:p-6 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Page title with Dashboard-style font */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Promo Codes
            </h1>
            <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>
          
          {/* Create Promo Code Form */}
          <div className="bg-white dark:bg-black p-3 sm:p-4 lg:p-6 rounded-lg shadow mb-6 sm:mb-8 mx-2 sm:mx-0">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-black dark:text-white">Create New Promo Code</h2>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Create a promo code that works for all products in your store.
            </p>
            
            <form onSubmit={handleCreateCoupon} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., SUMMER20"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    id="discount"
                    min="1"
                    max="100"
                    value={newCoupon.discount}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, discount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isCreating ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Promo Codes List */}
          <div className="bg-white dark:bg-black rounded-lg shadow mx-2 sm:mx-0">
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-black dark:text-white">Active Promo Codes</h2>
            </div>
            
            {loading ? (
              <div className="p-4 sm:p-6 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-4 sm:p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No promo codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Discount
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {coupon.code}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900 dark:text-white">
                            {coupon.discount}%
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900 dark:text-white">
                            {formatDate(coupon.createdAt)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 