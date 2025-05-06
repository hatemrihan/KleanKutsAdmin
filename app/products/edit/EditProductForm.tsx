'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import dynamic from 'next/dynamic';

const UploadSection = dynamic(() => import('../../sections/UploadSection'), { ssr: false });
const CategorySection = dynamic(() => import('../../sections/CategorySection'), { ssr: false });
const SizeVariantsManager = dynamic(() => import('../../components/SizeVariantsManager'), { ssr: false });

interface ColorVariant {
  color: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  selectedSizes: string[];
  gender: string;
  stock: number;
  discount: number;
  discountType: string;
  selectedImages: string[];
  categories: string[];
  sizeVariants?: SizeVariant[];
}

interface Category {
  _id: string;
  name: string;
  description: string;
  parent?: string;
}

interface EditProductFormProps {
  id: string;
}

const initialFormData: Product = {
  _id: '',
  title: '',
  description: '',
  price: 0,
  selectedSizes: [],
  gender: 'Unisex',
  stock: 0,
  discount: 0,
  discountType: 'percentage',
  selectedImages: [],
  categories: [],
  sizeVariants: []
};

export default function EditProductForm({ id }: EditProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Product>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  // Use formData.selectedImages directly for UploadSection
  // const [selectedImages, setSelectedImages] = useState<string[]>([]); 

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const genders = ['Men', 'Woman', 'Unisex'];

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/products?id=${id}`);
      if (response.data) {
        setFormData({
          ...initialFormData,
          ...response.data,
          selectedSizes: response.data.selectedSizes || [],
          selectedImages: response.data.selectedImages || [],
          categories: response.data.categories || [],
          price: Number(response.data.price) || 0,
          stock: Number(response.data.stock) || 0,
          discount: Number(response.data.discount) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [fetchProduct, fetchCategories]);

  const handleInputChange = (
    field: keyof Product,
    value: string | number | string[] | ((prev: string[]) => string[])
  ) => {
    // Convert numeric fields
    const numericFields: (keyof Product)[] = ['price', 'stock', 'discount'];
    let processedValue: string | number | string[];

    if (numericFields.includes(field) && typeof value === 'string') {
      processedValue = Number(value) || 0; // Convert to number, default to 0 if conversion fails
    } else if (typeof value === 'function') {
      // Handle function updaters for arrays (selectedImages, categories, selectedSizes)
      processedValue = value(formData[field] as string[]);
    } else {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Type guard for React.ChangeEvent
  function isChangeEvent(value: unknown): value is React.ChangeEvent<HTMLSelectElement> {
    if (!value || typeof value !== 'object') return false;
    const obj = value as { target?: { value?: unknown } };
    return !!obj.target && 'value' in obj.target;
  }

  // handleSelectChange is removed as handleInputChange now handles select changes via onChange directly

  const handleSizeChange = (size: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      setError('Product title is required');
      return false;
    }
    
    if (!formData.description?.trim()) {
      setError('Product description is required');
      return false;
    }
    
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    
    // Check for size variants
    if (!formData.sizeVariants?.length) {
      setError('At least one size variant must be added');
      return false;
    }
    
    // Check that at least one size variant has at least one color variant
    const hasSizeWithColors = formData.sizeVariants.some(sv => sv.colorVariants && sv.colorVariants.length > 0);
    if (!hasSizeWithColors) {
      setError('At least one size must have color and stock information');
      return false;
    }

    if (!formData.categories?.length) {
      setError('At least one category must be selected');
      return false;
    }

    if (!formData.selectedImages?.length) {
      setError('At least one image must be uploaded');
      return false;
    }
    
    return true;
  };

  async function updateProduct(ev?: React.MouseEvent) {
    if (ev) {
      ev.preventDefault();
    }

    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/api/products?id=${id}`, {
        ...formData, // formData already includes selectedImages
        price: Number(formData.price),
        stock: Number(formData.stock),
        discount: Number(formData.discount)
      });

      if (response.data?.error) {
        setError(response.data.error);
        return;
      }

      if (response.data?.message === 'Product updated successfully') {
        setSuccess('Product updated successfully');
        setTimeout(() => {
          router.refresh();
          router.push('/products');
        }, 1500);
      } else {
        setError('Failed to update product. Please try again.');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      const axiosError = error as AxiosError<{ error: string }>;
      if (axiosError.response?.data?.error) {
        setError(axiosError.response.data.error);
      } else {
        setError('Failed to update product. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Product not found</div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateProduct(); }} className="space-y-8">
      {isLoading && <p>Loading product data...</p>}
      {error && <div className="mb-4 p-3 text-red-600 bg-red-100 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 text-green-600 bg-green-100 rounded-md">{success}</div>}

      {!isLoading && (
        <>
          {/* Product Details Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Product Name"
                  required
                />
              </div>

              {/* Price Input */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (EGY L.E.)</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)} // Pass string, handleInputChange converts
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="99.99"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Detailed product description"
                required
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <UploadSection 
            selectedImages={formData.selectedImages}
            setSelectedImages={(updater) => {
              // The updater can be a function or a new array
              const newImages = typeof updater === 'function'
                ? updater(formData.selectedImages)
                : updater;
              handleInputChange('selectedImages', newImages);
            }}
          />

          {/* Category Selection Section */}
          <CategorySection
            categories={categories}
            selectedCategories={formData.categories}
            onCategoryChange={(e) => {
              const categoryId = e.target.value;
              const isSelected = formData.categories.includes(categoryId);
              const newCategories = isSelected
                ? formData.categories.filter(id => id !== categoryId)
                : [...formData.categories, categoryId];
              handleInputChange('categories', newCategories);
            }}
          />

          {/* Attributes Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Attributes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sizes Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeChange(size)}
                      className={`px-3 py-1 border rounded-full text-sm transition-colors
                        ${formData.selectedSizes.includes(size)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)} // Use handleInputChange directly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  {genders.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Size Variants Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Size & Color Variants</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add specific sizes with their color variants and stock quantities. This allows for precise inventory management.
            </p>
            <SizeVariantsManager
              sizeVariants={formData.sizeVariants || []}
              onChange={(sizeVariants) => setFormData(prev => ({ ...prev, sizeVariants }))}
              availableSizes={sizes}
            />
          </div>

          {/* Inventory & Pricing Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Inventory & Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stock Input */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  id="stock"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)} // Pass string, handleInputChange converts
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="100"
                  min="0"
                />
              </div>

              {/* Discount Input */}
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="number"
                  id="discount"
                  value={formData.discount}
                  onChange={(e) => handleInputChange('discount', e.target.value)} // Pass string, handleInputChange converts
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="10"
                  min="0"
                />
              </div>

              {/* Discount Type Select */}
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => handleInputChange('discountType', e.target.value)} // Use handleInputChange directly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}