'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import dynamic from 'next/dynamic';

const UploadSection = dynamic(() => import('../../../sections/UploadSection'), { ssr: false });
const CategorySection = dynamic(() => import('../../../sections/CategorySection'), { ssr: false });
const SizeVariantsManager = dynamic(() => import('../../../components/SizeVariantsManager'), { ssr: false });

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
    value: string | number | string[] | ((prev: string[]) => string[]) | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: isChangeEvent(value) ? value.target.value : 
               typeof value === 'function' ? value(prev[field] as string[]) : value
    }));
  };

  // Type guard for React.ChangeEvent
  function isChangeEvent(value: unknown): value is React.ChangeEvent<HTMLSelectElement> {
    if (!value || typeof value !== 'object') return false;
    const obj = value as { target?: { value?: unknown } };
    return !!obj.target && 'value' in obj.target;
  }

  const handleSelectChange = (ev: React.ChangeEvent<HTMLSelectElement>, field: keyof Product) => {
    handleInputChange(field, ev.target.value);
  };

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
    
    // Check for size variants instead of selectedSizes
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
    
    if (!formData.selectedImages?.length) {
      setError('At least one product image is required');
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

    // Prepare the data for submission
    // Exclude _id field to prevent MongoDB error (cannot modify immutable _id field)
    const { _id, ...formDataWithoutId } = formData;
    
    const productData = {
      ...formDataWithoutId,
      price: Number(formData.price),
      stock: Number(formData.stock),
      discount: Number(formData.discount),
      // Ensure size variants are properly formatted
      sizeVariants: formData.sizeVariants?.map(sv => ({
        size: sv.size,
        colorVariants: sv.colorVariants?.map(cv => ({
          color: cv.color,
          stock: Number(cv.stock)
        }))
      }))
    };

    console.log('Submitting product data:', productData);

    try {
      const response = await axios.put(`/api/products?id=${id}`, productData);

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
      
      // Log detailed error information
      if (axiosError.response) {
        console.error('Response error data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        console.error('Response headers:', axiosError.response.headers);
      } else if (axiosError.request) {
        console.error('Request error:', axiosError.request);
      }
      
      if (axiosError.response?.data?.error) {
        setError(`Update failed: ${axiosError.response.data.error}`);
      } else if (axiosError.message) {
        setError(`Update failed: ${axiosError.message}`);
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
    <form onSubmit={e => e.preventDefault()} className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-green-600 mb-6 text-2xl font-bold border-b pb-3">Edit Product</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
        <input
          type="text"
          placeholder="Product name"
          value={formData.title}
          onChange={ev => handleInputChange('title', ev.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          placeholder="Product description"
          value={formData.description}
          onChange={ev => handleInputChange('description', ev.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (in EGY L.E.)</label>
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={ev => handleInputChange('price', Number(ev.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input
            type="number"
            placeholder="Total stock"
            value={formData.stock}
            onChange={ev => handleInputChange('stock', Number(ev.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
          <input
            type="number"
            placeholder="Discount amount"
            value={formData.discount}
            onChange={ev => handleInputChange('discount', Number(ev.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
          <select
            value={formData.discountType}
            onChange={ev => handleSelectChange(ev, 'discountType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={ev => handleSelectChange(ev, 'gender')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white"
          >
            {genders.map(gender => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
        <div className="flex gap-2 flex-wrap p-3 border border-gray-300 rounded-md bg-gray-50">
          {sizes.map(size => (
            <label key={size} className="flex items-center gap-1 cursor-pointer bg-white px-3 py-1 rounded-md border border-gray-200 hover:border-green-500">
              <input
                type="checkbox"
                checked={formData.selectedSizes.includes(size)}
                onChange={() => handleSizeChange(size)}
                className="text-green-500 focus:ring-green-500"
              />
              {size}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">Size & Color Variants</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add specific sizes with their color variants and stock quantities for precise inventory management.
        </p>
        <SizeVariantsManager
          sizeVariants={formData.sizeVariants || []}
          onChange={(sizeVariants) => setFormData(prev => ({ ...prev, sizeVariants }))}
          availableSizes={sizes}
        />
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">Categories</h2>
        <CategorySection
          categories={categories}
          selectedCategories={formData.categories}
          onCategoryChange={categories => handleInputChange('categories', categories)}
        />
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">Product Images</h2>
        <UploadSection
          selectedImages={formData.selectedImages}
          setSelectedImages={images => handleInputChange('selectedImages', images)}
        />
      </div>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-green-600 border-b pb-2">Inventory Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.sizeVariants && formData.sizeVariants.length > 0 ? (
                formData.sizeVariants.flatMap(sizeVariant => 
                  sizeVariant.colorVariants.map((colorVariant, colorIndex) => (
                    <tr key={`${sizeVariant.size}-${colorVariant.color}`}>
                      {colorIndex === 0 ? (
                        <td rowSpan={sizeVariant.colorVariants.length} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                          {sizeVariant.size}
                        </td>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colorVariant.color}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colorVariant.stock} units</td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center italic">
                    No size or color variants added yet. Add them in the Size & Color Variants section above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={() => router.push('/products')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={updateProduct}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 