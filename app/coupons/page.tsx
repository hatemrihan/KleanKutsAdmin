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
  usageLimit: number;
  usedCount: number;
  createdAt: string;
  expiresAt: string | null;
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
    discount: 10,
    usageLimit: -1,
    expiresAt: ''
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
        ...newCoupon,
        expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).toISOString() : null
      };
      
      const response = await axios.post('/api/coupon', couponData);
      
      if (response.data.success) {
        toast.success('Promo code created successfully');
        setNewCoupon({
          code: '',
          discount: 10,
          usageLimit: -1,
          expiresAt: ''
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
      <main className="flex-1 p-6 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">Promo Codes</h1>
          </div>
          
          {/* Create Promo Code Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Promo Code</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Create a promo code that works for all products in your store.
            </p>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    id="usageLimit"
                    min="-1"
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    -1 = unlimited, 0 = disabled, 1+ = limited uses
                  </p>
                </div>
                
                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Promo Codes List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-black dark:text-white">Active Promo Codes</h2>
            </div>
            
            {loading ? (
              <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No promo codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Discount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Expires
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black dark:text-white">{coupon.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">{coupon.discount}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {coupon.usageLimit === -1 ? (
                              <span>Unlimited</span>
                            ) : (
                              <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">{formatDate(coupon.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">{formatDate(coupon.expiresAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteCoupon(coupon._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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