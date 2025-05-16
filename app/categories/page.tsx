'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import Nav from '../sections/nav';
import CategoryImageUpload from '../components/CategoryImageUpload';
import CategoryPreview from '../components/CategoryPreview';
import { useRouter } from 'next/navigation';
import { DarkModePanel, DarkModeText, DarkModeStatus, DarkModeInput } from '../components/ui/dark-mode-wrapper';

interface Category {
  _id: string;
  name: string;
  description?: string;
  headline?: string;
  subheadline?: string;
  displayOrder?: number;
  callToAction?: {
    text: string;
    link: string;
  };
  customStyles?: {
    textColor: string;
    backgroundColor: string;
    overlayOpacity: number;
  };
  isActive?: boolean;
  parent?: string | null;
  image?: string | null;
  mobileImage?: string | null;
  layout?: {
    desktop?: {
      imagePosition: 'left' | 'right' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
    mobile?: {
      imagePosition: 'top' | 'bottom' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
  };
  desktopDescription?: string;
  mobileDescription?: string;
  additionalImages?: string[];
  properties?: Record<string, string[]>;
}

interface FormData {
  name: string;
  description: string;
  headline: string;
  subheadline: string;
  displayOrder: number;
  callToAction: {
    text: string;
    link: string;
  };
  customStyles: {
    textColor: string;
    backgroundColor: string;
    overlayOpacity: number;
  };
  parent: string;
  image: string;
  mobileImage: string;
  additionalImages: string[];
  desktopDescription: string;
  mobileDescription: string;
  layout: {
    desktop: {
      imagePosition: 'left' | 'right' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
    mobile: {
      imagePosition: 'top' | 'bottom' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
  };
  isActive: boolean;
  properties: Record<string, string[]>;
}

interface ApiErrorResponse {
  error: string;
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewModes, setPreviewModes] = useState<Record<string, 'desktop' | 'mobile'>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    headline: '',
    subheadline: '',
    displayOrder: 0,
    callToAction: {
      text: 'EXPLORE',
      link: ''
    },
    customStyles: {
      textColor: '#000000',
      backgroundColor: '',
      overlayOpacity: 0
    },
    parent: '',
    image: '',
    mobileImage: '',
    additionalImages: [],
    desktopDescription: '',
    mobileDescription: '',
    layout: {
      desktop: {
        imagePosition: 'center',
        textAlignment: 'center'
      },
      mobile: {
        imagePosition: 'center',
        textAlignment: 'center'
      }
    },
    isActive: true,
    properties: {}
  });
  const [isNewParentModalOpen, setIsNewParentModalOpen] = useState(false);
  const [newParentData, setNewParentData] = useState({
    name: '',
    description: ''
  });
  const [newProperty, setNewProperty] = useState({
    name: '',
    values: ''
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'short' }));
  const router = useRouter();

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error fetching categories:', error);
      toast.error(axiosError.response?.data?.error || 'Failed to fetch categories');
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof FormData] as Record<string, any>;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        headline: formData.headline?.trim() || '',
        subheadline: formData.subheadline?.trim() || '',
        displayOrder: formData.displayOrder || 0,
        callToAction: formData.callToAction,
        customStyles: formData.customStyles,
        parent: formData.parent || null,
        image: formData.image?.trim() || null,
        mobileImage: formData.mobileImage?.trim() || null,
        additionalImages: formData.additionalImages || [],
        desktopDescription: formData.desktopDescription?.trim() || '',
        mobileDescription: formData.mobileDescription?.trim() || '',
        layout: formData.layout,
        isActive: formData.isActive,
        properties: formData.properties || {}
      };

      const response = await axios.post('/api/categories', categoryData);
      if (response.data) {
        toast.success('Category added successfully');
        setFormData({
          name: '',
          description: '',
          headline: '',
          subheadline: '',
          displayOrder: 0,
          callToAction: {
            text: 'EXPLORE',
            link: ''
          },
          customStyles: {
            textColor: '#000000',
            backgroundColor: '',
            overlayOpacity: 0
          },
          parent: '',
          image: '',
          mobileImage: '',
          additionalImages: [],
          desktopDescription: '',
          mobileDescription: '',
          layout: {
            desktop: {
              imagePosition: 'center',
              textAlignment: 'center'
            },
            mobile: {
              imagePosition: 'center',
              textAlignment: 'center'
            }
          },
          isActive: true,
          properties: {}
        });
        fetchCategories();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error adding category:', error);
      setError(axiosError.response?.data?.error || 'Failed to add category');
      toast.error(axiosError.response?.data?.error || 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewParent = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/categories', {
        ...newParentData,
        parent: null // This will be a parent category
      });
      
      if (response.data) {
        toast.success('New parent category added successfully');
        setNewParentData({ name: '', description: '' });
        setIsNewParentModalOpen(false);
        fetchCategories(); // Refresh the categories list
      }
    } catch (error) {
      console.error('Error adding parent category:', error);
      toast.error('Failed to add parent category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = () => {
    if (!newProperty.name || !newProperty.values) return;
    
    const values = newProperty.values.split(',').map(v => v.trim());
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [newProperty.name]: values
      }
    }));
    setNewProperty({ name: '', values: '' });
  };

  const handleRemoveProperty = (propertyName: string) => {
    setFormData(prev => {
      const newProperties = { ...prev.properties };
      delete newProperties[propertyName];
      return {
        ...prev,
        properties: newProperties
      };
    });
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    fetchCategoriesByMonth(value);
  };

  const fetchCategoriesByMonth = async (month?: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/categories' + (month ? `?month=${month}` : ''));
      setCategories(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error fetching categories:', error);
      toast.error(axiosError.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      setIsLoading(true);
      await axios.put(`/api/categories/${id}`, { isActive: !currentState });
      toast.success(`Category ${currentState ? 'deactivated' : 'activated'} successfully`);
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category active state:', error);
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <h1 className="text-2xl font-semibold mb-4 lg:mb-0 dark:text-gray-100">Categories</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="search" placeholder="Search" className="px-4 py-2 border rounded-lg w-full sm:w-auto dark:bg-black dark:border-gray-700 dark:text-gray-100" />
              </div>
              <Select 
                value={selectedMonth} 
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-full sm:w-auto dark:border-gray-700 dark:bg-black">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="dark:bg-black dark:border-gray-700">
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="dark:text-gray-100 dark:focus:bg-gray-900">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <select className="px-4 py-2 border rounded-lg w-full sm:w-auto dark:bg-black dark:border-gray-700 dark:text-gray-100">
                <option>Sales</option>
              </select>
              <div className="flex items-center gap-2">
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
                  <p className="font-medium dark:text-gray-100">SEIF</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manager</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DarkModePanel className="p-4 lg:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Add New Category</h2>
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-gray-100">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Category Name *</label>
                      <DarkModeInput
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter category name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Description</label>
                      <DarkModeInput
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter category description"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium dark:text-gray-200">Parent Category</label>
                        <Dialog open={isNewParentModalOpen} onOpenChange={setIsNewParentModalOpen}>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                            >
                              + Add New Parent
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] dark:bg-black dark:border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="dark:text-gray-100">Add New Parent Category</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category Name</label>
                                <DarkModeInput
                                  value={newParentData.name}
                                  onChange={(e) => setNewParentData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Enter parent category name"
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Description</label>
                                <DarkModeInput
                                  value={newParentData.description}
                                  onChange={(e) => setNewParentData(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Enter parent category description"
                                  className="w-full"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsNewParentModalOpen(false)}
                                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-black"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleAddNewParent}
                                  disabled={isLoading || !newParentData.name}
                                  className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                                >
                                  {isLoading ? 'Adding...' : 'Add Parent Category'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select
                        value={formData.parent}
                        onValueChange={(value) => handleInputChange('parent', value)}
                      >
                        <SelectTrigger className="w-full dark:bg-black dark:border-gray-700 dark:text-gray-100">
                          <SelectValue placeholder="Select a parent category (optional)" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black dark:border-gray-700">
                          <SelectGroup>
                            <div className="px-2 py-1.5 text-sm font-semibold dark:text-gray-200">Main Categories</div>
                            {categories
                              .filter(cat => !cat.parent)
                              .map((category) => (
                                <SelectItem 
                                  key={category._id} 
                                  value={category._id}
                                  className="flex items-center justify-between dark:text-gray-100 dark:focus:bg-gray-900"
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">                      
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-black dark:border-gray-700"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-white/90">
                        Active (visible on storefront)
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Display Order</label>
                      <DarkModeInput
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
                        placeholder="Enter display order (0 = default)"
                        className="w-full"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lower numbers display first</p>
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-gray-100">Display Options</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Headline</label>
                      <DarkModeInput
                        type="text"
                        value={formData.headline}
                        onChange={(e) => handleInputChange('headline', e.target.value)}
                        placeholder="Main headline shown on category image"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Subheadline</label>
                      <DarkModeInput
                        type="text"
                        value={formData.subheadline}
                        onChange={(e) => handleInputChange('subheadline', e.target.value)}
                        placeholder="Secondary text shown below headline"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Button Text</label>
                        <DarkModeInput
                          type="text"
                          value={formData.callToAction.text}
                          onChange={(e) => handleInputChange('callToAction.text', e.target.value)}
                          placeholder="Call to action button text"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Button Link</label>
                        <DarkModeInput
                          type="text"
                          value={formData.callToAction.link}
                          onChange={(e) => handleInputChange('callToAction.link', e.target.value)}
                          placeholder="URL or path for button"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Custom Styling */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-white">Custom Styling</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Text Color</label>
                        <div className="flex">
                          <input
                            type="color"
                            value={formData.customStyles.textColor}
                            onChange={(e) => handleInputChange('customStyles.textColor', e.target.value)}
                            className="w-12 h-9 p-1 rounded-l-md border border-gray-300"
                          />
                          <Input
                            type="text"
                            value={formData.customStyles.textColor}
                            onChange={(e) => handleInputChange('customStyles.textColor', e.target.value)}
                            className="rounded-l-none flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Background Color (optional)</label>
                        <div className="flex">
                          <input
                            type="color"
                            value={formData.customStyles.backgroundColor || '#ffffff'}
                            onChange={(e) => handleInputChange('customStyles.backgroundColor', e.target.value)}
                            className="w-12 h-9 p-1 rounded-l-md border border-gray-300"
                          />
                          <Input
                            type="text"
                            value={formData.customStyles.backgroundColor}
                            onChange={(e) => handleInputChange('customStyles.backgroundColor', e.target.value)}
                            placeholder="Leave empty for transparent"
                            className="rounded-l-none flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Overlay Opacity: {formData.customStyles.overlayOpacity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.customStyles.overlayOpacity}
                        onChange={(e) => handleInputChange('customStyles.overlayOpacity', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Images */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-gray-100">Images</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Main Image</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CategoryImageUpload 
                          onImageUploaded={(url) => handleInputChange('image', url)}
                          label="Upload Main Image"
                        />
                        {formData.image && (
                          <div className="relative h-32 rounded-md overflow-hidden">
                            <Image 
                              src={formData.image} 
                              alt="Main category image" 
                              fill 
                              className="object-cover"
                              unoptimized={true}
                            />
                            <button
                              type="button"
                              onClick={() => handleInputChange('image', '')}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                              aria-label="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">This will be displayed on category page and storefront</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Mobile-Specific Image (optional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CategoryImageUpload 
                          onImageUploaded={(url) => handleInputChange('mobileImage', url)}
                          label="Upload Mobile Image"
                        />
                        {formData.mobileImage && (
                          <div className="relative h-32 rounded-md overflow-hidden">
                            <Image 
                              src={formData.mobileImage} 
                              alt="Mobile category image" 
                              fill 
                              className="object-cover"
                              unoptimized={true}
                            />
                            <button
                              type="button"
                              onClick={() => handleInputChange('mobileImage', '')}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                              aria-label="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Will fall back to main image if not provided</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Images (Gallery)</label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {formData.additionalImages.map((img, index) => (
                            <div key={index} className="relative h-24 rounded-md overflow-hidden group">
                              {img ? (
                                <>
                                  <Image 
                                    src={img} 
                                    alt={`Gallery image ${index + 1}`} 
                                    fill 
                                    className="object-cover"
                                    unoptimized={true}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = [...formData.additionalImages];
                                      newImages[index] = '';
                                      handleInputChange('additionalImages', newImages);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                    aria-label="Remove image"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <CategoryImageUpload 
                                  onImageUploaded={(url) => {
                                    const newImages = [...formData.additionalImages];
                                    newImages[index] = url;
                                    handleInputChange('additionalImages', newImages);
                                  }}
                                  label={`Image ${index + 1}`}
                                />
                              )}
                            </div>
                          ))}
                          {formData.additionalImages.length < 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('additionalImages', [...formData.additionalImages, '']);
                              }}
                              className="border-2 border-dashed border-gray-300 h-24 rounded-md flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Image
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Add up to 3 additional images for the gallery view</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout Options */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-gray-100">Layout Options</h3>
                  
                  {/* Desktop Layout */}
                  <div className="mb-4">
                    <div className="font-medium text-sm mb-2">Desktop Layout</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Image Position</label>
                        <Select
                          value={formData.layout.desktop.imagePosition}
                          onValueChange={(value) => handleInputChange('layout.desktop.imagePosition', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Text Alignment</label>
                        <Select
                          value={formData.layout.desktop.textAlignment}
                          onValueChange={(value) => handleInputChange('layout.desktop.textAlignment', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-1">Desktop Description</label>
                      <Input
                        type="text"
                        value={formData.desktopDescription}
                        onChange={(e) => handleInputChange('desktopDescription', e.target.value)}
                        placeholder="Description for desktop view (optional)"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div>
                    <div className="font-medium text-sm mb-2">Mobile Layout</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Image Position</label>
                        <Select
                          value={formData.layout.mobile.imagePosition}
                          onValueChange={(value) => handleInputChange('layout.mobile.imagePosition', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Text Alignment</label>
                        <Select
                          value={formData.layout.mobile.textAlignment}
                          onValueChange={(value) => handleInputChange('layout.mobile.textAlignment', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select alignment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium mb-1">Mobile Description</label>
                      <Input
                        type="text"
                        value={formData.mobileDescription}
                        onChange={(e) => handleInputChange('mobileDescription', e.target.value)}
                        placeholder="Description for mobile view (optional)"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Properties */}
                <div className="bg-gray-50 dark:bg-black p-4 rounded-md">
                  <h3 className="text-md font-medium mb-3 dark:text-gray-100">Properties</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <DarkModeInput
                        type="text"
                        value={newProperty.name}
                        onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Property name (e.g., Color)"
                        className="flex-1"
                      />
                      <DarkModeInput
                        type="text"
                        value={newProperty.values}
                        onChange={(e) => setNewProperty(prev => ({ ...prev, values: e.target.value }))}
                        placeholder="Values (comma-separated)"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddProperty}
                        disabled={!newProperty.name || !newProperty.values}
                        className="w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700"
                      >
                        Add
                      </Button>
                    </div>

                    {Object.entries(formData.properties).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(formData.properties).map(([name, values]) => (
                          <div key={name} className="flex items-center justify-between p-2 bg-gray-200 dark:bg-black/80 rounded">
                            <div className="break-all pr-2">
                              <span className="font-medium dark:text-gray-100">{name}:</span>
                              <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                                {values.join(', ')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProperty(name)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding Category...' : 'Add Category'}
                </Button>
              </form>
            </DarkModePanel>

            <DarkModePanel className="p-4 lg:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6 dark:text-gray-100">Current Categories</h2>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category._id} className="flex flex-col gap-4 p-4 border dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-medium dark:text-gray-100">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                        )}
                        {category.parent && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Parent: {categories.find(c => c._id === category.parent)?.name}
                          </p>
                        )}
                        {category.properties && Object.entries(category.properties).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(category.properties).map(([name, values]) => (
                              <div key={name} className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{name}:</span> {values.join(', ')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/categories/edit/${category._id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shrink-0"
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0"
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Category Preview */}
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium dark:text-gray-200">Preview:</div>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => setPreviewModes(prev => ({ ...prev, [category._id]: 'desktop' }))}
                            className={`text-xs px-2 py-0.5 rounded ${previewModes[category._id] !== 'mobile' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-black/80 text-gray-700 dark:text-white/90'}`}
                          >
                            Desktop
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPreviewModes(prev => ({ ...prev, [category._id]: 'mobile' }))}
                            className={`text-xs px-2 py-0.5 rounded ${previewModes[category._id] === 'mobile' ? 'bg-blue-500 dark:bg-blue-600 text-white' : 'bg-gray-200 dark:bg-black/80 text-gray-700 dark:text-white/90'}`}
                          >
                            Mobile
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <CategoryPreview 
                          category={category} 
                          isMobile={previewModes[category._id] === 'mobile'} 
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        onClick={() => handleToggleActive(category._id, category.isActive || false)}
                        className={`px-2 py-1 rounded cursor-pointer ${
                          category.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-800 dark:hover:text-red-400' 
                            : 'bg-gray-100 dark:bg-black text-gray-800 dark:text-white/90 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-800 dark:hover:text-green-400'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                      
                      {category.displayOrder && category.displayOrder > 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                          Order: {category.displayOrder}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {categories.length === 0 && !isLoading && (
                  <div className="text-center py-10 text-gray-500 dark:text-white/70 bg-gray-50 dark:bg-black/80 rounded-lg">
                    No categories found
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                  </div>
                )}
              </div>
            </DarkModePanel>
          </div>
        </div>
      </main>
    </div>
  );
} 