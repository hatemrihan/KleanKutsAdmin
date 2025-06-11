'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import Nav from '../../sections/nav';
import dynamic from 'next/dynamic';
import { 
  DarkModePanel, 
  DarkModeInput, 
  DarkModeLabel,
} from '../../components/ui/dark-mode-wrapper';

// Lazy load components with ssr disabled to prevent hydration mismatch
const UploadSection = dynamic(() => import('../../sections/UploadSection'), { ssr: false });
const SizeVariantsManager = dynamic(() => import('../../components/SizeVariantsManager'), { ssr: false });
const ProductContentFields = dynamic(() => import('../../components/ProductContentFields'), { ssr: false });

// Import types
import { SizeVariant } from '../../types/product';


interface Category {
  _id: string;
  name: string;
  description: string;
  parent?: string;
}

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  color: string;
  stock: number;
  discount: number;
  discountType: string;
  selectedSizes: string[];
  gender: string;
  selectedImages: string[];
  sizeVariants: SizeVariant[];

  sizeGuide: string;
  packaging: string;
  shippingReturns: string;
}

export default function NewProduct() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    category: '',
    color: '',
    stock: 0,
    discount: 0,
    discountType: 'percentage', // Default to percentage
    selectedSizes: [],
    gender: 'Unisex', // Default gender
    selectedImages: [],
    sizeVariants: [],
  
    sizeGuide: '',
    packaging: '',
    shippingReturns: '',
  });
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: ''
  });

  // Restore promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [createPromo, setCreatePromo] = useState(false);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const genders = ['Men', 'Woman', 'Unisex'];



  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | string[] | SizeVariant[]) => {
    // Convert numeric fields
    const numericFields: (keyof ProductFormData)[] = ['price', 'stock', 'discount'];
    const processedValue = numericFields.includes(field) && typeof value === 'string'
      ? Number(value) || 0 // Convert to number, default to 0 if conversion fails
      : value;

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  // Restore the promo code creation function
  const handleCreatePromo = async (productId: string) => {
    if (!createPromo || !promoCode) return;
    
    try {
      const response = await axios.post('/api/coupon', {
        code: promoCode,
        discount: promoDiscount,
        productId: productId
      });
      
      if (response.data.success) {
        toast.success(`Promo code "${promoCode}" created successfully`);
      } else {
        toast.error('Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Error creating promo code');
    }
  };

  // Modify handleSubmit to include promo code creation again
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Product title is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (formData.selectedImages.length === 0) {
        throw new Error('At least one product image is required');
      }
      
      // Validate size variants
      if (formData.sizeVariants.length === 0) {
        throw new Error('Please add at least one size variant with color and stock');
      }
      
      // Check if each size variant has at least one color variant
      const invalidSizeVariants = formData.sizeVariants.filter(sv => !sv.colorVariants || sv.colorVariants.length === 0);
      if (invalidSizeVariants.length > 0) {
        throw new Error(`Please add at least one color for size(s): ${invalidSizeVariants.map(sv => sv.size).join(', ')}`);
      }

      // Ensure all color variants have valid stock numbers
      let hasInvalidStock = false;
      formData.sizeVariants.forEach(sv => {
        if (sv.colorVariants) {
          sv.colorVariants.forEach(cv => {
            if (isNaN(Number(cv.stock)) || Number(cv.stock) < 0) {
              hasInvalidStock = true;
            }
          });
        }
      });
      
      if (hasInvalidStock) {
        throw new Error('All color variants must have valid stock numbers');
      }

      // Calculate total stock from size variants for compatibility
      const totalStock = formData.sizeVariants.reduce((total, sizeVariant) => {
        return total + (sizeVariant.colorVariants || []).reduce((sizeTotal, colorVariant) => {
          return sizeTotal + (Number(colorVariant.stock) || 0);
        }, 0);
      }, 0);

      // Extract selected sizes from the size variants
      const selectedSizes = formData.sizeVariants.map(sv => sv.size);

      // Prepare the data for submission
      const productData = {
        ...formData,
        name: formData.title, // Required by the model
        stock: totalStock, // Set calculated stock
        selectedSizes, // Update selected sizes based on variants
        gender: formData.gender, // Ensure gender is explicitly included
        // Remove categories field entirely since category selection is not available
        sizeVariants: formData.sizeVariants.map(sv => ({
          size: sv.size,
          colorVariants: sv.colorVariants.map(cv => ({
            color: cv.color,
            stock: Number(cv.stock)
          }))
        })),
      };
      
      console.log('Submitting product with data:', productData);
      const response = await axios.post('/api/products', productData);

      if (response.data) {
        // Restore promo code creation
        if (createPromo && promoCode) {
          await handleCreatePromo(response.data._id);
        }
        
        toast.success('Product created successfully');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string }>;
        const errorMessage = axiosError.response?.data?.error || 'Failed to create product. Please check your network connection and try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        // Handle non-axios errors (like our validation errors)
        const errorMessage = (error as Error).message || 'Failed to create product';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewCategory = async () => {
    try {
      setIsLoading(true);
      
      if (!newCategoryData.name.trim()) {
        toast.error('Category name is required');
        return;
      }
      
      const response = await axios.post('/api/categories', newCategoryData);
      if (response.data) {
        toast.success('Category created');
        setNewCategoryData({ name: '', description: '' });
        fetchCategories();
        setIsNewCategoryModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.filter((_, i) => i !== index)
    }));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <Nav />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile/Tablet only Get Back */}
          <div className="block md:hidden mb-4">
            <button
              onClick={() => router.push('/products')}
              className="text-yellow-500 dark:text-yellow-500 font-medium text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Get Back
            </button>
          </div>
          
          <h1 className="text-2xl font-semibold text-black dark:text-white mb-6">Create New Product</h1>
          
          {error && (
            <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-2/3 space-y-6">
                <DarkModePanel className="p-6">
                  <h2 className="text-lg font-semibold mb-4 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Product Information</h2>
                  
                  <div className="mb-4">
                    <DarkModeLabel htmlFor="title">Title</DarkModeLabel>
                    <DarkModeInput
                      id="title"
                      placeholder="Product title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <DarkModeLabel htmlFor="description">Description</DarkModeLabel>
                    <textarea
                      id="description"
                      placeholder="Product description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[100px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <DarkModeLabel htmlFor="price">Price (in EGY L.E.)</DarkModeLabel>
                      <DarkModeInput
                        id="price"
                        type="number"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('price', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <DarkModeLabel htmlFor="discount">Discount</DarkModeLabel>
                      <DarkModeInput
                        id="discount"
                        type="number"
                        placeholder="Discount amount"
                        value={formData.discount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('discount', Number(e.target.value))}
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
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('discountType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    
                    <div>
                      <DarkModeLabel htmlFor="gender">Gender</DarkModeLabel>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('gender', e.target.value)}
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
                  
                  {/* Removed sizes checkboxes section as requested */}
                  
                  <DarkModePanel className="mb-4">
                    <h3 className="text-lg text-center font-semibold mb-4 text-yellow-500 dark:text-yellow-500 border-b border-gray-200 dark:border-gray-800 pb-2">Size & Color Variants</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Add specific sizes with their color variants and stock quantities for precise inventory management.
                    </p>
                    <SizeVariantsManager
                      sizeVariants={formData.sizeVariants}
                      onChange={(sizeVariants) => handleInputChange('sizeVariants', sizeVariants)}
                      availableSizes={sizes}
                    />
                  </DarkModePanel>
                </DarkModePanel>
              </div>

              <div className="w-full lg:w-1/3 space-y-6">
                <div className="bg-white dark:bg-black p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold mb-4 text-black dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Product Details</h2>
                
                  {/* <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <Dialog open={isNewCategoryModalOpen} onOpenChange={setIsNewCategoryModalOpen}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400"
                          >
                            + Add New Category
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-black text-black dark:text-white">
                          <DialogHeader>
                            <DialogTitle className="text-black dark:text-white">Add New Parent Category</DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                              Create a new main category for your products. This category will appear in the main category list.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category Name</label>
                              <Input
                                value={newCategoryData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter category name"
                                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                              <Input
                                value={newCategoryData.description}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter category description"
                                className="bg-white dark:bg-black text-black dark:text-white border-gray-300 dark:border-gray-700"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsNewCategoryModalOpen(false)}
                                className="text-black dark:text-white border-gray-300 dark:border-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddNewCategory}
                                disabled={isLoading || !newCategoryData.name}
                                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                {isLoading ? 'Adding...' : 'Add Category'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="w-full dark:bg-black dark:text-white dark:border-gray-700">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-black dark:text-white dark:border-gray-700">
                        <SelectGroup>
                          <div className="px-2 py-1.5 text-sm font-semibold dark:text-gray-300">Main Categories</div>
                          {categories
                            .filter(cat => !cat.parent)
                            .map((category) => (
                              <SelectItem 
                                key={category._id} 
                                value={category._id}
                                className="flex items-center justify-between dark:text-white"
                              >
                                <span>{category.name}</span>
                                {category.description && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    ({category.description})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                        {categories.filter(cat => cat.parent).length > 0 && (
                          <SelectGroup>
                            <div className="px-2 py-1.5 text-sm font-semibold dark:text-gray-300">Sub Categories</div>
                            {categories
                              .filter(cat => cat.parent)
                              .map((category) => {
                                const parentCategory = categories.find(c => c._id === category.parent);
                                return (
                                  <SelectItem 
                                    key={category._id} 
                                    value={category._id}
                                    className="flex items-center justify-between dark:text-white"
                                  >
                                    <span>{category.name}</span>
                                    {parentCategory && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                        (Parent: {parentCategory.name})
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select a category or add a new one
                    </p>
                  </div> */}

                  {/* Removed color input section as requested */}
                </div>

                {/* Product Images */}
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
              </div>
            </div>

            <div className="bg-white dark:bg-black p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4 text-black dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Admin-Only Product Content</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                These fields are managed by admins and will be displayed on the product page. Customers cannot edit these fields.
              </p>
              <ProductContentFields
                sizeGuide={formData.sizeGuide}
                packaging={formData.packaging}
                shippingReturns={formData.shippingReturns}
                onChange={(field, value) => handleInputChange(field as keyof ProductFormData, value)}
              />
            </div>

            {/* Promo Code Section */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium mb-4">Promo Code</h2>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="createPromo"
                  checked={createPromo}
                  onChange={(e) => setCreatePromo(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="createPromo" className="ml-2 text-sm text-gray-700">
                  Create promo code for this product
                </label>
              </div>
              
              {createPromo && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Promo Code
                    </label>
                    <input
                      type="text"
                      id="promoCode"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g., SUMMER20"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This code will be automatically created when you save the product.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="promoDiscount" className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage
                    </label>
                    <input
                      type="number"
                      id="promoDiscount"
                      min="1"
                      max="100"
                      value={promoDiscount}
                      onChange={(e) => setPromoDiscount(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/products')}
                disabled={isLoading}
                className="w-full sm:w-auto border-gray-300 dark:border-gray-700 text-black dark:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white"
              >
                {isLoading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
