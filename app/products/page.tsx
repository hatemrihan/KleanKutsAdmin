'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

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
import ProductCard from '../components/ProductCard';
import { AxiosError } from 'axios';

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
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'short' }));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setProducts(response.data.products || response.data || []);
      setPagination(response.data.pagination || { totalPages: 1 });
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        setIsDeleting(true);
        toast.loading(`Deleting ${selectedProducts.length} product(s)...`);
        
        // Delete each product one by one
        let successCount = 0;
        let failCount = 0;
        
        for (const productId of selectedProducts) {
          try {
            await axios.delete(`/api/products?id=${productId}`);
            successCount++;
          } catch (error) {
            console.error(`Error deleting product ${productId}:`, error);
            failCount++;
          }
        }
        
        // Update products list
        await fetchProducts();
        
        // Clear selected products
        setSelectedProducts([]);
        setSelectAll(false);
        
        toast.dismiss();
        if (failCount === 0) {
          toast.success(`Successfully deleted ${successCount} product(s)`);
        } else {
          toast.error(`Deleted ${successCount} product(s), failed to delete ${failCount} product(s)`);
        }
        
        // Dispatch an event to update other components
        window.dispatchEvent(new CustomEvent('product-deleted', { 
          detail: { count: successCount, ids: selectedProducts } 
        }));
      } catch (error) {
        console.error('Error in bulk delete operation:', error);
        toast.error('An error occurred during the delete operation');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    await handleDelete(productId);
  };

  const handleEditProduct = (productId: string) => {
    handleEdit(productId);
  };

  const handleAddProduct = () => {
    router.push('/products/new');
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Nav />
      <main className="p-2 sm:p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Products
            </h1>
            <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <div></div>
            <div className="flex gap-3 w-full sm:w-auto">
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.length})`}
                </button>
              )}
              <Button 
                onClick={handleAddProduct}
                className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black text-sm sm:text-base"
              >
                Add New Product
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Button>
            </div>
            
          </div>

          <div className="bg-white dark:bg-black border dark:border-gray-800 rounded-lg shadow-sm mb-6 mx-2 sm:mx-0">
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
              <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 bg-white dark:bg-black text-sm sm:text-base"
              />
              
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-black text-sm sm:text-base">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {/* Add category options here */}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={sortOption} 
                  onValueChange={setSortOption}
                >
                  <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-black text-sm sm:text-base">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">{error}</p>
              <Button 
                onClick={() => fetchProducts()} 
                className="mt-4"
              >
                Try Again
                </Button>
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No products found</p>
                  {searchQuery || categoryFilter !== 'all' ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your filters or search query
                    </p>
                  ) : (
                    <Button onClick={handleAddProduct} className="mt-2">
                      Add Your First Product
                    </Button>
                                )}
                              </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mx-2 sm:mx-0">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      onDelete={handleDeleteProduct}
                      onEdit={handleEditProduct}
                    />
                  ))}
                </div>
              )}
              
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white rounded-l-md border border-gray-300 hover:bg-gray-50 dark:bg-black dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 disabled:opacity-50"
                    >
                      Previous
                                    </button>
                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`hidden sm:block px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium border border-gray-300 dark:border-gray-700 ${
                          currentPage === i + 1
                            ? 'bg-black text-white dark:bg-gray-800'
                            : 'text-gray-500 bg-white hover:bg-gray-50 dark:bg-black dark:text-gray-300 dark:hover:bg-gray-900'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <span className="sm:hidden px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 dark:bg-black dark:border-gray-700 dark:text-gray-300">
                      {currentPage} / {pagination.totalPages}
                                  </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-50 dark:bg-black dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                              </div>
                            )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}