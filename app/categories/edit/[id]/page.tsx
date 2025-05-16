'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import Image from 'next/image';
import CategoryImageUpload from '../../../components/CategoryImageUpload';
import CategoryPreview from '../../../components/CategoryPreview';

interface Category {
  _id: string;
  name: string;
  description: string;
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
  parent?: string;
  image?: string;
  mobileImage?: string;
  additionalImages?: string[];
  desktopDescription?: string;
  mobileDescription?: string;
  layout?: {
    desktop: {
      imagePosition: 'left' | 'right' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
    mobile: {
      imagePosition: 'top' | 'bottom' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
  };
  properties?: Record<string, string[]>;
  createdAt: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
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
    isActive: true,
    parent: '',
    image: '',
    mobileImage: '',
    additionalImages: [] as string[],
    desktopDescription: '',
    mobileDescription: '',
    layout: {
      desktop: {
        imagePosition: 'center' as 'left' | 'right' | 'center',
        textAlignment: 'center' as 'left' | 'right' | 'center'
      },
      mobile: {
        imagePosition: 'center' as 'top' | 'bottom' | 'center',
        textAlignment: 'center' as 'left' | 'right' | 'center'
      }
    },
    properties: {} as Record<string, string[]>
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (categoryId) {
      fetchCategory(categoryId);
      fetchCategories();
    }
  }, [categoryId]);

  const fetchCategory = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/categories/${id}`);
      if (response.data) {
        setCategory(response.data);
        setFormData({
          name: response.data.name,
          description: response.data.description || '',
          headline: response.data.headline || '',
          subheadline: response.data.subheadline || '',
          displayOrder: response.data.displayOrder || 0,
          callToAction: response.data.callToAction || { text: 'EXPLORE', link: '' },
          customStyles: response.data.customStyles || { textColor: '#000000', backgroundColor: '', overlayOpacity: 0 },
          isActive: typeof response.data.isActive === 'boolean' ? response.data.isActive : true,
          parent: response.data.parent || '',
          image: response.data.image || '',
          mobileImage: response.data.mobileImage || '',
          additionalImages: response.data.additionalImages || [],
          desktopDescription: response.data.desktopDescription || '',
          mobileDescription: response.data.mobileDescription || '',
          layout: response.data.layout || {
            desktop: {
              imagePosition: 'center' as 'left' | 'right' | 'center',
              textAlignment: 'center' as 'left' | 'right' | 'center'
            },
            mobile: {
              imagePosition: 'center' as 'top' | 'bottom' | 'center',
              textAlignment: 'center' as 'left' | 'right' | 'center'
            }
          },
          properties: response.data.properties || {}
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
      toast.error('Failed to load category');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
      return;
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => {
          const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        });
      } else if (parts.length === 3) {
        const [parent, middle, child] = parts;
        setFormData(prev => {
          const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [middle]: {
                ...parentObj[middle],
                [child]: value
              }
            }
          };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleArrayChange = (field: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create the complete category data
      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        headline: formData.headline?.trim() || '',
        subheadline: formData.subheadline?.trim() || '',
        displayOrder: formData.displayOrder || 0,
        callToAction: formData.callToAction,
        customStyles: formData.customStyles,
        isActive: formData.isActive,
        parent: formData.parent || null,
        image: formData.image?.trim() || null,
        mobileImage: formData.mobileImage?.trim() || null,
        additionalImages: formData.additionalImages.filter(Boolean) || [],
        desktopDescription: formData.desktopDescription?.trim() || '',
        mobileDescription: formData.mobileDescription?.trim() || '',
        layout: formData.layout,
        properties: formData.properties || {}
      };
      
      console.log('Updating category with active status:', submitData.isActive);
      
      const response = await axios.put(`/api/categories/${categoryId}`, submitData);
      if (response.data) {
        setSuccessMessage('Category updated successfully!');
        toast.success(`Category updated successfully! Active: ${submitData.isActive ? 'Yes' : 'No'}`);
        
        // Wait for 2 seconds before redirecting
        setTimeout(() => {
          router.push('/categories');
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !category) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded">
          Category not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Edit Category</h1>
          <button
            onClick={() => router.push('/categories')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            GET BACK
          </button>
        </div>
        
        {/* Active Status Banner */}
        <div className={`p-3 mb-6 rounded-lg ${formData.isActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {formData.isActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`font-medium ${formData.isActive ? 'text-green-700' : 'text-red-700'}`}>
                Status: {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium">
                {formData.isActive ? 'Visible on storefront' : 'Hidden from storefront'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Preview Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Preview:</h2>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`text-xs px-2 py-0.5 rounded ${previewMode !== 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Desktop
              </button>
              <button 
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`text-xs px-2 py-0.5 rounded ${previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Mobile
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <CategoryPreview 
              category={{
                _id: categoryId,
                name: formData.name || category?.name || '',
                headline: formData.headline,
                subheadline: formData.subheadline,
                desktopDescription: formData.desktopDescription,
                mobileDescription: formData.mobileDescription,
                image: formData.image,
                mobileImage: formData.mobileImage,
                additionalImages: formData.additionalImages,
                callToAction: formData.callToAction,
                customStyles: formData.customStyles,
                layout: formData.layout,
                isActive: formData.isActive
              }} 
              isMobile={previewMode === 'mobile'} 
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Parent Category</label>
                <Select
                  value={formData.parent}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <option value="">None (Main Category)</option>
                      {categories
                        .filter(cat => cat._id !== categoryId) // Exclude current category from parent options
                        .map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <Input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter display order (0 = default)"
                  className="w-full"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers display first</p>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Display Options</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <Input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  placeholder="Main headline shown on category image"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subheadline</label>
                <Input
                  type="text"
                  name="subheadline"
                  value={formData.subheadline}
                  onChange={handleInputChange}
                  placeholder="Secondary text shown below headline"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Button Text</label>
                  <Input
                    type="text"
                    name="callToAction.text"
                    value={formData.callToAction.text}
                    onChange={handleInputChange}
                    placeholder="Call to action button text"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Button Link (optional)</label>
                  <Input
                    type="text"
                    name="callToAction.link"
                    value={formData.callToAction.link}
                    onChange={handleInputChange}
                    placeholder="Custom URL (leave empty for default)"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Styling */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Custom Styling</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Text Color</label>
                  <div className="flex">
                    <input
                      type="color"
                      name="customStyles.textColor"
                      value={formData.customStyles.textColor}
                      onChange={handleInputChange}
                      className="w-12 h-9 p-1 rounded-l-md border border-gray-300"
                    />
                    <Input
                      type="text"
                      name="customStyles.textColor"
                      value={formData.customStyles.textColor}
                      onChange={handleInputChange}
                      className="rounded-l-none flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color (optional)</label>
                  <div className="flex">
                    <input
                      type="color"
                      name="customStyles.backgroundColor"
                      value={formData.customStyles.backgroundColor || '#ffffff'}
                      onChange={handleInputChange}
                      className="w-12 h-9 p-1 rounded-l-md border border-gray-300"
                    />
                    <Input
                      type="text"
                      name="customStyles.backgroundColor"
                      value={formData.customStyles.backgroundColor}
                      onChange={handleInputChange}
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
                  name="customStyles.overlayOpacity"
                  min="0"
                  max="100"
                  value={formData.customStyles.overlayOpacity}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Layout Options */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Layout Options</h3>
            
            {/* Desktop Layout */}
            <div className="mb-4">
              <div className="font-medium text-sm mb-2">Desktop Layout</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Image Position</label>
                  <Select
                    value={formData.layout.desktop.imagePosition}
                    onValueChange={(value) => {
                      const updatedForm = {...formData};
                      updatedForm.layout.desktop.imagePosition = value as 'left' | 'right' | 'center';
                      setFormData(updatedForm);
                    }}
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
                    onValueChange={(value) => {
                      const updatedForm = {...formData};
                      updatedForm.layout.desktop.textAlignment = value as 'left' | 'right' | 'center';
                      setFormData(updatedForm);
                    }}
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
                  name="desktopDescription"
                  value={formData.desktopDescription}
                  onChange={handleInputChange}
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
                    onValueChange={(value) => {
                      const updatedForm = {...formData};
                      updatedForm.layout.mobile.imagePosition = value as 'top' | 'bottom' | 'center';
                      setFormData(updatedForm);
                    }}
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
                    onValueChange={(value) => {
                      const updatedForm = {...formData};
                      updatedForm.layout.mobile.textAlignment = value as 'left' | 'right' | 'center';
                      setFormData(updatedForm);
                    }}
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
                  name="mobileDescription"
                  value={formData.mobileDescription}
                  onChange={handleInputChange}
                  placeholder="Description for mobile view (optional)"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Images</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Main Image</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CategoryImageUpload 
                    onImageUploaded={(url) => setFormData(prev => ({ ...prev, image: url }))}
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
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
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
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mobile-Specific Image (optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CategoryImageUpload 
                    onImageUploaded={(url) => setFormData(prev => ({ ...prev, mobileImage: url }))}
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
                        onClick={() => setFormData(prev => ({ ...prev, mobileImage: '' }))}
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
                                setFormData(prev => ({ ...prev, additionalImages: newImages }));
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
                              setFormData(prev => ({ ...prev, additionalImages: newImages }));
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
                          setFormData(prev => ({ ...prev, additionalImages: [...prev.additionalImages, ''] }));
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
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/categories')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 