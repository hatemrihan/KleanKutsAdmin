'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import dynamic from 'next/dynamic';
import { 
  DarkModePanel, 
  DarkModeInput, 
  DarkModeText, 
  DarkModeLabel,
  DarkModeButton,
  DarkModeStatus,
  DarkModeTable,
  DarkModeTableHeader,
  DarkModeTableRow,
  DarkModeTableCell
} from '../../../components/ui/dark-mode-wrapper';

const UploadSection = dynamic(() => import('../../../sections/UploadSection'), { ssr: false });
const CategorySection = dynamic(() => import('../../../sections/CategorySection'), { ssr: false });
const SizeVariantsManager = dynamic(() => import('../../../components/SizeVariantsManager'), { ssr: false });
const ProductContentFields = dynamic(() => import('../../../components/ProductContentFields'), { ssr: false });

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
  stock?: number; // Now optional since it's calculated from sizeVariants
  discount: number;
  discountType: string;
  selectedImages: string[];
  categories: string[];
  sizeVariants?: SizeVariant[];
  materials?: string[];
  sizeGuide?: string;
  packaging?: string;
  shippingReturns?: string;
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
  // stock is now calculated from sizeVariants
  discount: 0,
  discountType: 'percentage',
  selectedImages: [],
  categories: [],
  sizeVariants: [],
  materials: [],
  sizeGuide: '',
  packaging: '',
  shippingReturns: ''
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
        // We no longer need to set the stock field directly as it's calculated from size variants
        setFormData({
          ...initialFormData,
          ...response.data,
          selectedSizes: response.data.selectedSizes || [],
          selectedImages: response.data.selectedImages || [],
          categories: response.data.categories || [],
          price: Number(response.data.price) || 0,
          discount: Number(response.data.discount) || 0,
          // Ensure sizeVariants is properly initialized
          sizeVariants: response.data.sizeVariants || []
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

  // Calculate total stock from all size/color variants
  const calculateTotalStock = (sizeVariants: SizeVariant[]): number => {
    return sizeVariants.reduce((total, sizeVariant) => {
      // Check if colorVariants exists before attempting to reduce
      if (!sizeVariant.colorVariants) return total;
      
      return total + sizeVariant.colorVariants.reduce((sizeTotal, colorVariant) => {
        return sizeTotal + (Number(colorVariant.stock) || 0);
      }, 0);
    }, 0);
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
    
    // Calculate total stock from size variants
    const calculatedTotalStock = calculateTotalStock(formData.sizeVariants || []);
    
    // Extract selected sizes from the size variants
    const selectedSizes = formData.sizeVariants?.map(sv => sv.size) || [];
    
    const productData = {
      ...formDataWithoutId,
      name: formData.title, // Required by the model
      price: Number(formData.price),
      // Use calculated stock from size variants instead of standalone stock field
      stock: calculatedTotalStock,
      selectedSizes, // Update based on the size variants
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
      <div className="flex justify-center items-center min-h-screen dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (error && !formData._id) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-black">
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-black">
        <div className="text-red-500 dark:text-red-400">Product not found</div>
      </div>
    );
  }

  return (
    <form onSubmit={e => e.preventDefault()} className="max-w-5xl mx-auto p-4 sm:p-6 dark:bg-black">
      <h1 className="text-black dark:text-white mb-6 text-2xl font-bold border-b border-gray-200 dark:border-gray-800 pb-3">Edit Product</h1>
      
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded relative mb-6">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      <div className="mb-4">
        <DarkModeLabel htmlFor="title">Product name</DarkModeLabel>
        <DarkModeInput
          id="title"
          type="text"
          placeholder="Product name"
          value={formData.title}
          onChange={ev => handleInputChange('title', ev.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="mb-4">
        <DarkModeLabel htmlFor="description">Description</DarkModeLabel>
        <textarea
          id="description"
          placeholder="Product description"
          value={formData.description}
          onChange={ev => handleInputChange('description', ev.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <DarkModeLabel htmlFor="price">Price (in EGY L.E.)</DarkModeLabel>
          <DarkModeInput
            id="price"
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={ev => handleInputChange('price', Number(ev.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <DarkModeLabel htmlFor="totalStock">Total Stock</DarkModeLabel>
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-black/50 text-black dark:text-white">
            {calculateTotalStock(formData.sizeVariants || [])}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculated from size & color variants</p>
          </div>
        </div>

        <div>
          <DarkModeLabel htmlFor="discount">Discount</DarkModeLabel>
          <DarkModeInput
            id="discount"
            type="number"
            placeholder="Discount amount"
            value={formData.discount}
            onChange={ev => handleInputChange('discount', Number(ev.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <DarkModeLabel htmlFor="discountType">Discount Type</DarkModeLabel>
          <select
            id="discountType"
            value={formData.discountType}
            onChange={ev => handleSelectChange(ev, 'discountType')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div>
          <DarkModeLabel htmlFor="gender">Gender</DarkModeLabel>
          <select
            id="gender"
            value={formData.gender}
            onChange={ev => handleSelectChange(ev, 'gender')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {genders.map(gender => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DarkModePanel className="mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-2">Size & Color Variants</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add specific sizes with their color variants and stock quantities for precise inventory management.
        </p>
        <SizeVariantsManager
          sizeVariants={formData.sizeVariants || []}
          onChange={(sizeVariants) => setFormData(prev => ({ ...prev, sizeVariants }))}
          availableSizes={sizes}
        />
      </DarkModePanel>

      <DarkModePanel className="mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-2">Categories</h2>
        <CategorySection
          categories={categories}
          selectedCategories={formData.categories}
          onCategoryChange={categories => handleInputChange('categories', categories)}
        />
      </DarkModePanel>

      <DarkModePanel className="mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-2">Product Images</h2>
        <UploadSection
          selectedImages={formData.selectedImages}
          setSelectedImages={images => handleInputChange('selectedImages', images)}
        />
      </DarkModePanel>

      <DarkModePanel className="mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-2">Inventory Summary</h2>
        <div className="overflow-x-auto">
          <DarkModeTable>
            <DarkModeTableHeader>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Stock</th>
              </tr>
            </DarkModeTableHeader>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {formData.sizeVariants && formData.sizeVariants.length > 0 ? (
                formData.sizeVariants.flatMap(sizeVariant => 
                  sizeVariant.colorVariants && sizeVariant.colorVariants.length > 0 ? 
                  sizeVariant.colorVariants.map((colorVariant, colorIndex) => (
                    <DarkModeTableRow key={`${sizeVariant.size}-${colorVariant.color}`}>
                      {colorIndex === 0 ? (
                        <DarkModeTableCell rowSpan={sizeVariant.colorVariants.length} className="whitespace-nowrap text-sm font-medium bg-gray-50 dark:bg-black/30">
                          {sizeVariant.size}
                        </DarkModeTableCell>
                      ) : null}
                      <DarkModeTableCell className="whitespace-nowrap text-sm">{colorVariant.color}</DarkModeTableCell>
                      <DarkModeTableCell className="whitespace-nowrap text-sm">{colorVariant.stock} units</DarkModeTableCell>
                    </DarkModeTableRow>
                  )) : 
                  [<DarkModeTableRow key={`${sizeVariant.size}-no-colors`}>
                    <DarkModeTableCell className="whitespace-nowrap text-sm font-medium bg-gray-50 dark:bg-black/30">
                      {sizeVariant.size}
                    </DarkModeTableCell>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 italic">
                      No color variants added
                    </td>
                  </DarkModeTableRow>]
                )
              ) : (
                <DarkModeTableRow>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center italic">
                    No size or color variants added yet. Add them in the Size & Color Variants section above.
                  </td>
                </DarkModeTableRow>
              )}
            </tbody>
          </DarkModeTable>
        </div>
      </DarkModePanel>

      <DarkModePanel className="mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Admin-Only Product Content</h2>
        <ProductContentFields
          materials={formData.materials || []}
          sizeGuide={formData.sizeGuide || ''}
          packaging={formData.packaging || ''}
          shippingReturns={formData.shippingReturns || ''}
          onChange={(field, value) => handleInputChange(field as keyof Product, value)}
        />
      </DarkModePanel>

      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={() => router.push('/products')}
          className="px-4 py-2 bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          Cancel
        </button>
        <button
          onClick={updateProduct}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 