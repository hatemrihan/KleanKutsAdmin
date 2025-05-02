'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import dynamic from 'next/dynamic';

const UploadSection = dynamic(() => import('@/app/sections/UploadSection'), { ssr: false });
const CategorySection = dynamic(() => import('@/app/sections/CategorySection'), { ssr: false });

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
  categories: []
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
    
    if (formData.stock < 0) {
      setError('Stock cannot be negative');
      return false;
    }
    
    if (!formData.selectedSizes?.length) {
      setError('At least one size must be selected');
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
        ...formData,
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
    <form onSubmit={e => e.preventDefault()} className="max-w-4xl mx-auto p-4">
      <h1 className="text-green-600 mb-2 text-xl">Edit Product</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <label>Product name</label>
      <input
        type="text"
        placeholder="product name"
        value={formData.title}
        onChange={ev => handleInputChange('title', ev.target.value)}
      />
      
      <label>Description</label>
      <textarea
        placeholder="description"
        value={formData.description}
        onChange={ev => handleInputChange('description', ev.target.value)}
      />
      
      <label>Price (in USD)</label>
      <input
        type="number"
        placeholder="price"
        value={formData.price}
        onChange={ev => handleInputChange('price', Number(ev.target.value))}
      />

      <label>Stock</label>
      <input
        type="number"
        placeholder="stock"
        value={formData.stock}
        onChange={ev => handleInputChange('stock', Number(ev.target.value))}
      />

      <label>Discount</label>
      <input
        type="number"
        placeholder="discount"
        value={formData.discount}
        onChange={ev => handleInputChange('discount', Number(ev.target.value))}
      />

      <label>Discount Type</label>
      <select
        value={formData.discountType}
        onChange={ev => handleSelectChange(ev, 'discountType')}
      >
        <option value="percentage">Percentage</option>
        <option value="fixed">Fixed Amount</option>
      </select>

      <label>Gender</label>
      <select
        value={formData.gender}
        onChange={ev => handleSelectChange(ev, 'gender')}
      >
        {genders.map(gender => (
          <option key={gender} value={gender}>
            {gender}
          </option>
        ))}
      </select>

      <label>Sizes</label>
      <div className="flex gap-2 flex-wrap">
        {sizes.map(size => (
          <label key={size} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.selectedSizes.includes(size)}
              onChange={() => handleSizeChange(size)}
            />
            {size}
          </label>
        ))}
      </div>

      <CategorySection
        categories={categories}
        selectedCategories={formData.categories}
        onCategoryChange={categories => handleInputChange('categories', categories)}
      />

      <UploadSection
        selectedImages={formData.selectedImages}
        setSelectedImages={images => handleInputChange('selectedImages', images)}
      />

      <div className="flex gap-2">
        <button
          onClick={() => router.push('/products')}
          className="btn-default"
        >
          Cancel
        </button>
        <button
          onClick={updateProduct}
          className="btn-primary"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
} 