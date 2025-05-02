'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  selectedImages: string[];
  deletedAt: string;
}

export default function RecycleBin() {
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedProducts();
  }, []);

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products?deleted=true');
      setDeletedProducts(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching deleted products:', error);
      setError('Failed to load deleted products');
      toast.error('Failed to load deleted products');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (productId: string) => {
    try {
      await axios.patch(`/api/products/${productId}`);
      toast.success('Product restored successfully');
      fetchDeletedProducts();
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Failed to restore product');
    }
  };

  const handlePermanentDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/products/${productId}/permanent`);
        toast.success('Product permanently deleted');
        fetchDeletedProducts();
      } catch (error) {
        console.error('Error permanently deleting product:', error);
        toast.error('Failed to permanently delete product');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-lg shadow"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Products
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {deletedProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No deleted products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deleted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deletedProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.selectedImages?.[0] && (
                            <div className="relative h-10 w-10">
                              <Image 
                                src={product.selectedImages[0]} 
                                alt={product.title}
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.deletedAt ? new Date(product.deletedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRestore(product._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete Permanently
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
    </div>
  );
} 