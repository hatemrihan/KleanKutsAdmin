'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Nav from '../sections/nav';
import { Input } from '../components/ui/input';
import { DarkModePanel, DarkModeInput, DarkModeStatus } from '../components/ui/dark-mode-wrapper';
import { calculateTotalStock } from '../utils/stockCalculator';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  selectedSizes: string[];
  gender: string;
  color: string;
  stock: number;
  discount: number;
  discountType: string;
  selectedImages: string[];
  categories: string[];
  sizeVariants?: Array<{
    size: string;
    colorVariants: Array<{
      color: string;
      stock: number;
    }>
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="flex-shrink-0 h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 h-24 w-24">
      <Image
        src={src}
        alt={alt}
        width={96}
        height={96}
        className="rounded-lg object-cover w-full h-full"
        onError={() => setError(true)}
        priority
      />
    </div>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'short' }));

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    fetchProducts(value);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (month?: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get('/api/products' + (month ? `?month=${month}` : ''));
      console.log('Fetched products:', response.data);
      setProducts(response.data);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching products:', error);
      const errorMessage = apiError.response?.data?.error || 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await axios.delete(`/api/products/${productId}?permanent=true`);
      if (response.data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-black">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
              <p className="text-gray-500 dark:text-white dark:opacity-70 mt-1">Manage your product inventory</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white dark:opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <DarkModeInput
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 w-full dark:bg-black dark:border-white dark:border-opacity-20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-full sm:w-[120px] dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="dark:bg-black dark:border-white dark:border-opacity-20">
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/products/new" className="w-full sm:w-auto">
                <Button className="w-full bg-black hover:bg-gray-800 dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {products.length === 0 ? (
            <DarkModePanel className="rounded-lg shadow-sm p-8 text-center border dark:border-white dark:border-opacity-20">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-white dark:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 text-gray-500 dark:text-white dark:opacity-70">Get started by adding your first product.</p>
              <Link href="/products/new" className="mt-6 inline-block">
                <Button className="bg-black hover:bg-gray-800 dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Product
                </Button>
              </Link>
            </DarkModePanel>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden border dark:border-white dark:border-opacity-20">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white dark:divide-opacity-20">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Categories</th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-white dark:divide-opacity-20">
                    {products
                      .filter(product => 
                        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((product) => {
                        // Calculate total stock from size variants
                        const totalStock = calculateTotalStock(product);
                        
                        return (
                          <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-white dark:hover:bg-opacity-5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <ProductImage src={product.selectedImages[0]} alt={product.title} />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{product.title}</div>
                                  <div className="text-sm text-gray-500 dark:text-white dark:opacity-70 truncate max-w-xs">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">{product.price.toLocaleString()} L.E.</div>
                              {product.discount > 0 && (
                                <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full inline-block mt-1">
                                  {product.discount}% off
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {totalStock} in stock
                              </div>
                              <div className="mt-1">
                                {totalStock > 10 ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                    In Stock
                                  </span>
                                ) : totalStock > 0 ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {product.categories?.length > 0 ? (
                                  product.categories.map((categoryId, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                      {categoryId}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500 dark:text-white dark:opacity-70 text-sm">No categories</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <Link href={`/products/${product._id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                  Edit
                                </Link>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                                      Delete
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="dark:text-white">Delete Product</AlertDialogTitle>
                                      <AlertDialogDescription className="dark:text-white dark:opacity-70">
                                        Are you sure you want to delete this product? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                      <AlertDialogCancel className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDelete(product._id)} 
                                        className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {products
                  .filter(product => 
                    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((product) => {
                    // Calculate total stock from size variants for mobile view too
                    const totalStock = calculateTotalStock(product);
                    
                    return (
                      <div key={product._id} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-white dark:border-opacity-20">
                        <div className="flex items-start">
                          <ProductImage src={product.selectedImages[0]} alt={product.title} />
                          <div className="ml-4 flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{product.title}</div>
                            <div className="text-sm text-gray-500 dark:text-white dark:opacity-70 line-clamp-2 mt-1">{product.description}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {product.categories?.length > 0 ? (
                                product.categories.map((categoryId, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                    {categoryId}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 dark:text-white dark:opacity-70 text-xs">No categories</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{product.price.toLocaleString()} L.E.</div>
                            {product.discount > 0 && (
                              <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full inline-block mt-1">
                                {product.discount}% off
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {totalStock} in stock
                            </div>
                            <div className="mt-1">
                              {totalStock > 10 ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                  In Stock
                                </span>
                              ) : totalStock > 0 ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-4">
                          <Link href={`/products/${product._id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm">
                            Edit
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm">
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="dark:text-white">Delete Product</AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-white dark:opacity-70">
                                  Are you sure you want to delete this product? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(product._id)} 
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}