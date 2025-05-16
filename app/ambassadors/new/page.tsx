'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Nav from '@/app/sections/nav';
import { DarkModePanel, DarkModeInput, DarkModeText } from '@/app/components/ui/dark-mode-wrapper';

export default function NewAmbassadorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commissionRate: 10,
    reason: 'Direct invitation',
    userId: 'admin-generated'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post('/api/ambassadors/create', formData);
      
      if (response.data.ambassador) {
        toast.success('Ambassador added successfully');
        router.push('/ambassadors');
      }
    } catch (err: any) {
      console.error('Error adding ambassador:', err);
      toast.error(err.response?.data?.error || 'Failed to add ambassador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Ambassador</h1>
            <Link 
              href="/ambassadors"
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md dark:text-white"
            >
              Cancel
            </Link>
          </div>
          
          <DarkModePanel className="rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Name *</label>
                <DarkModeInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter ambassador's full name"
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Email *</label>
                <DarkModeInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter ambassador's email"
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">Phone Number</label>
                <DarkModeInput
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter ambassador's phone number"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">
                  Commission Rate (%)
                </label>
                <DarkModeInput
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The percentage of each sale the ambassador will earn
                </p>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Ambassador'}
                </button>
              </div>
            </form>
          </DarkModePanel>
        </div>
      </main>
    </div>
  );
} 