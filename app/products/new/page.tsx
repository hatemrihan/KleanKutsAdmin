'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import Nav from '../../sections/nav';
import dynamic from 'next/dynamic';

// Lazy load components with ssr disabled to prevent hydration mismatch
const UploadSection = dynamic(() => import('../../sections/UploadSection'), { ssr: false });


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
    gender: '',
    selectedImages: []
  });
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: ''
  });
  // Remove imageUrl state and related handler
  // const [imageUrl, setImageUrl] = useState('');

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const genders = ['Men', 'Woman', 'Unisex'];

  const colors = [
    { name: 'Brown', value: 'brown' },
    { name: 'Black', value: 'black' },
    { name: 'White', value: 'white' },
    { name: 'Blue', value: 'blue' }
  ];

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

  const handleInputChange = (field: keyof ProductFormData, value: string | number | string[]) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Product title is required');
        setIsLoading(false);
        return;
      }
      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        setIsLoading(false);
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        setIsLoading(false);
        return;
      }
      if (formData.stock < 0) {
        setError('Stock cannot be negative');
        setIsLoading(false);
        return;
      }
      if (formData.selectedImages.length === 0) {
        setError('At least one product image is required');
        setIsLoading(false);
        return;
      }
      if (!formData.color) {
        setError('Please select a color');
        setIsLoading(false);
        return;
      }
      if (formData.selectedSizes.length === 0) {
        setError('Please select at least one size');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('/api/products', {
        ...formData,
        categories: [formData.category] // Ensure categories is an array
      });

      if (response.data) {
        toast.success('Product created successfully');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      const axiosError = error as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || 'Failed to create product');
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewCategory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/categories', {
        ...newCategoryData,
        parent: null // This will be a parent category
      });
      
      if (response.data) {
        toast.success('New category added successfully');
        setNewCategoryData({ name: '', description: '' });
        setIsNewCategoryModalOpen(false);
        fetchCategories(); // Refresh the categories list
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed handleAddImageUrl function

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.filter((_, i) => i !== index)
    }));
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold">New Product</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h1 className="text-2xl font-semibold">OverView</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input type="search" placeholder="Search" className="px-4 py-2 border rounded-lg w-full sm:w-auto" />
                </div>
                <select className="px-4 py-2 border rounded-lg w-full sm:w-auto">
                  <option>Feb</option>
                </select>
                <select className="px-4 py-2 border rounded-lg w-full sm:w-auto">
                  <option>Sales</option>
                </select>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">Kenzy</p>
                    <p className="text-sm text-gray-500">Manager</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-6">General Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name Product</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Puffer Jacket With Pocket Detail"
                        className="w-full p-3 bg-gray-50 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description Product</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Cropped puffer jacket made of technical fabric..."
                        className="w-full p-3 bg-gray-50 rounded-lg h-32"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Size</label>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => handleSizeToggle(size)}
                              className={`px-4 py-2 rounded-lg ${
                                formData.selectedSizes.includes(size)
                                  ? 'bg-green-400 text-white'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Gender</label>
                        <div className="flex flex-wrap gap-2">
                          {genders.map((g) => (
                            <button
                              key={g}
                              onClick={() => handleInputChange('gender', g)}
                              className={`px-4 py-2 rounded-lg ${
                                formData.gender === g ? 'bg-green-400 text-white' : 'bg-gray-100'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-6">Pricing And Stock</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Base Pricing</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="47.55"
                        className="w-full p-3 bg-gray-50 rounded-lg"
                        min="0.01"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Stock</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        placeholder="77"
                        className="w-full p-3 bg-gray-50 rounded-lg"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Discount</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                        placeholder="10"
                        className="w-full p-3 bg-gray-50 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Discount Type</label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) => handleInputChange('discountType', value)}
                      >
                        <SelectTrigger className="w-full p-3 bg-gray-50 rounded-lg">
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-96 space-y-8">
                {/* Replace manual image input with UploadSection */}
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

                {/* Old image input section removed */}

                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">Category</label>
                    <Dialog open={isNewCategoryModalOpen} onOpenChange={setIsNewCategoryModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          + Add New Category
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Parent Category</DialogTitle>
                          <DialogDescription>
                            Create a new main category for your products. This category will appear in the main category list.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Category Name</label>
                            <Input
                              value={newCategoryData.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter category name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Input
                              value={newCategoryData.description}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter category description"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsNewCategoryModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddNewCategory}
                              disabled={isLoading || !newCategoryData.name}
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <div className="px-2 py-1.5 text-sm font-semibold">Main Categories</div>
                        {categories
                          .filter(cat => !cat.parent)
                          .map((category) => (
                            <SelectItem 
                              key={category._id} 
                              value={category._id}
                              className="flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              {category.description && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({category.description})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      {categories.filter(cat => cat.parent).length > 0 && (
                        <SelectGroup>
                          <div className="px-2 py-1.5 text-sm font-semibold">Sub Categories</div>
                          {categories
                            .filter(cat => cat.parent)
                            .map((category) => {
                              const parentCategory = categories.find(c => c._id === category.parent);
                              return (
                                <SelectItem 
                                  key={category._id} 
                                  value={category._id}
                                  className="flex items-center justify-between"
                                >
                                  <span>{category.name}</span>
                                  {parentCategory && (
                                    <span className="text-xs text-gray-500 ml-2">
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
                  <p className="mt-1 text-xs text-gray-500">
                    Select a category or add a new one
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('color', color.value)}
                        className={`p-2 border rounded-lg text-sm flex items-center justify-center ${
                          formData.color === color.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/products')}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
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
