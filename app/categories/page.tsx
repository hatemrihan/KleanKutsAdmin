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

interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: string | null;
  image?: string | null;
  properties?: Record<string, string[]>;
}

interface FormData {
  name: string;
  description: string;
  parent: string;
  image: string;
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    parent: '',
    image: '',
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

  const handleInputChange = (field: string, value: string) => {
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
      
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        parent: formData.parent || null,
        image: formData.image?.trim() || null,
        properties: formData.properties || {}
      };

      const response = await axios.post('/api/categories', categoryData);
      if (response.data) {
        toast.success('Category added successfully');
        setFormData({
          name: '',
          description: '',
          parent: '',
          image: '',
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

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
    fetchCategories();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <h1 className="text-2xl font-semibold mb-4 lg:mb-0">Categories</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="search" placeholder="Search" className="px-4 py-2 border rounded-lg w-full sm:w-auto" />
              </div>
              <select 
                className="px-4 py-2 border rounded-lg w-full sm:w-auto"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select className="px-4 py-2 border rounded-lg w-full sm:w-auto">
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
                  <p className="font-medium">Kenzy</p>
                  <p className="text-sm text-gray-500">Manager</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Add New Category</h2>
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter category name"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter category description"
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Parent Category</label>
                    <Dialog open={isNewParentModalOpen} onOpenChange={setIsNewParentModalOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          + Add New Parent
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Parent Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Category Name</label>
                            <Input
                              value={newParentData.name}
                              onChange={(e) => setNewParentData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter parent category name"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Input
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
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddNewParent}
                              disabled={isLoading || !newParentData.name}
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a parent category (optional)" />
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
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <Input
                    type="text"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="Enter image URL"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Properties</label>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        value={newProperty.name}
                        onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Property name (e.g., Color)"
                        className="flex-1"
                      />
                      <Input
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
                        className="w-full sm:w-auto"
                      >
                        Add
                      </Button>
                    </div>

                    {Object.entries(formData.properties).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(formData.properties).map(([name, values]) => (
                          <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="break-all pr-2">
                              <span className="font-medium">{name}:</span>
                              <span className="text-sm text-gray-600 ml-2">
                                {values.join(', ')}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProperty(name)}
                              className="text-red-500 hover:text-red-700 shrink-0"
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
                  disabled={isLoading || !formData.name}
                  className="w-full"
                >
                  {isLoading ? 'Adding...' : 'Add Category'}
                </Button>
              </form>
            </div>

            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Current Categories</h2>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                      {category.parent && (
                        <p className="text-xs text-gray-400">
                          Parent: {categories.find(c => c._id === category.parent)?.name}
                        </p>
                      )}
                      {category.properties && Object.entries(category.properties).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(category.properties).map(([name, values]) => (
                            <div key={name} className="text-xs text-gray-600">
                              <span className="font-medium">{name}:</span> {values.join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-red-600 hover:text-red-700 shrink-0"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 