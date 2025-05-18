'use client';

import { useState, useEffect } from 'react';
import Nav from "../sections/nav";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { config } from '../../config';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Card as CardUI, CardContent as CardContentUI, CardDescription, CardHeader as CardHeaderUI, CardTitle as CardTitleUI } from "../components/ui/card";
import { DarkModePanel, DarkModeStatus, DarkModeText } from "../components/ui/dark-mode-wrapper";

// Common interfaces
interface DashboardStats {
  totalOrders: number;
  totalSales: number;
  activeProducts: number;
  totalCategories: number;
  monthlyGoal: number;
  currentMonthSales: number;
  recentOrders: Array<{
    _id: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  monthlyData: Array<{
    name: string;
    sales: number;
  }>;
}

// Fallback data for when API call fails
const fallbackStats: DashboardStats = {
  totalOrders: 0,
  totalSales: 0,
  activeProducts: 0,
  totalCategories: 0,
  monthlyGoal: 100000,
  currentMonthSales: 0,
  recentOrders: [],
  monthlyData: []
};

// Orders interfaces
interface Product {
  _id: string;
  name: string;
  price: number;
}

interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Order {
  _id: string;
  customer: Customer;
  products: OrderProduct[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  total?: number;
  apartmentNumber?: string;
  city?: string;
}

interface ApiErrorResponse {
  error: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-black/10 text-black dark:bg-white/10 dark:text-white',
  processing: 'bg-black/20 text-black dark:bg-white/20 dark:text-white',
  shipped: 'bg-black/30 text-black dark:bg-white/30 dark:text-white',
  delivered: 'bg-black/40 text-black dark:bg-white/40 dark:text-white',
  cancelled: 'bg-black/50 text-black dark:bg-white/50 dark:text-white',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  const [waitlistLoading, setWaitlistLoading] = useState(true);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Sales goal state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  
  // Waitlist and Ambassadors state
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [ambassadorsCount, setAmbassadorsCount] = useState(0);
  const [pendingAmbassadorsCount, setPendingAmbassadorsCount] = useState(0);
  
  // Site status
  const [siteStatus, setSiteStatus] = useState({ active: true, message: '' });
  
  useEffect(() => {
    fetchDashboardStats();
    fetchSiteStatus();
    fetchWaitlistCount();
    fetchAmbassadorsCount();
  }, []);
  
  // Refresh dashboard stats when switching back to dashboard section
  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeSection]);
  
  // Fetch orders when orders tab is selected
  useEffect(() => {
    if (activeSection === 'orders') {
      fetchOrders();
    }
  }, [activeSection]);
  
  // Also fetch orders immediately when component loads
  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const waitlistInterval = setInterval(() => {
      fetchWaitlistCount();
    }, 60000); // 60 seconds
    
    return () => clearInterval(waitlistInterval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Use absolute URL for API calls
      const apiUrl = window.location.origin + '/api/dashboard';
      console.log('Fetching dashboard data from:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('Dashboard data received:', response.data);
      
      // IMPORTANT: Update monthly goal from API first, then set stats
      // This ensures the goal is updated before any stats components are rendered
      if (response.data && typeof response.data.monthlyGoal === 'number') {
        setMonthlyGoal(response.data.monthlyGoal);
        console.log('Updated monthly goal from API:', response.data.monthlyGoal);
      }
      
      // Set dashboard stats after monthly goal is updated
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Use fallback data instead of showing error
      setMonthlyGoal(fallbackStats.monthlyGoal);
      setStats(fallbackStats);
      
      // Show error toast
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch waitlist count from real-time API
  const fetchWaitlistCount = async () => {
    try {
      setWaitlistLoading(true);
      const response = await axios.get('/api/waitlist/count');
      if (response.data && response.data.success) {
        setWaitlistCount(response.data.count);
        console.log('Waitlist count fetched:', response.data.count);
      } else {
        console.error('Error in waitlist count response:', response.data);
        // Default to 0 if there's an issue
        setWaitlistCount(0);
      }
    } catch (error) {
      console.error('Error fetching waitlist count:', error);
      setWaitlistCount(0);
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Fetch site status
  const fetchSiteStatus = async () => {
    try {
      const response = await axios.get('/api/settings/site-status');
      if (response.data.status === 'success' && response.data.data) {
        setSiteStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching site status:', error);
    }
  };
  

  
  // Fetch ambassadors count
  const fetchAmbassadorsCount = async () => {
    try {
      const response = await axios.get('/api/ambassadors');
      if (response.data && Array.isArray(response.data.ambassadors)) {
        setAmbassadorsCount(response.data.ambassadors.length);
        
        // Count pending ambassadors
        const pending = response.data.ambassadors.filter(
          (ambassador: any) => ambassador.status === 'pending'
        ).length;
        setPendingAmbassadorsCount(pending);
      }
    } catch (error) {
      console.error('Error fetching ambassadors count:', error);
    }
  };
  
  // Update monthly sales goal
  const updateMonthlySalesGoal = async () => {
    try {
      setIsSavingGoal(true);
      
      console.log('Updating monthly goal to:', monthlyGoal);
      
      // Make API call to update the monthly goal
      const response = await axios.post('/api/dashboard/update-goal', { monthlyGoal });
      console.log('Update goal response:', response.data);
      
      // Fetch updated dashboard stats to reflect the new goal
      await fetchDashboardStats();
      
      toast.success('Monthly sales goal updated successfully');
      setIsEditingGoal(false);
    } catch (error) {
      console.error('Error updating monthly goal:', error);
      toast.error('Failed to update monthly sales goal');
    } finally {
      setIsSavingGoal(false);
    }
  };
  
  // Orders functionality
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      const response = await axios.get(`${config.apiUrl}/orders`);
      console.log('Raw orders data:', response.data);
      
      // Transform and validate orders data
      const validatedOrders = response.data.map((order: any) => {
        // Skip invalid orders
        if (!order) return null;

        // Create a default customer object
        const defaultCustomer = {
          name: 'Unknown Customer',
          email: 'No email provided',
          phone: 'No phone provided',
          address: 'No address provided'
        };

        // Handle old order format (with firstName/lastName)
        if (!order.customer && (order.firstName || order.lastName)) {
          return {
            ...order,
            customer: {
              name: `${order.firstName || ''} ${order.lastName || ''}`.trim() || defaultCustomer.name,
              email: order.email || defaultCustomer.email,
              phone: order.phone || defaultCustomer.phone,
              address: order.address || defaultCustomer.address
            },
            totalAmount: Number(order.total || order.totalAmount) || 0,
            products: Array.isArray(order.products) ? order.products.map((product: any) => ({
              productId: product.id || product.productId || '',
              name: product.name || 'Unknown Product',
              price: Number(product.price) || 0,
              quantity: Number(product.quantity) || 1,
              size: product.size || 'N/A',
              image: product.image || ''
            })) : []
          };
        }

        // Ensure customer object exists and has all required fields
        const customer = order.customer || defaultCustomer;
        order.customer = {
          name: customer.name || defaultCustomer.name,
          email: customer.email || defaultCustomer.email,
          phone: customer.phone || defaultCustomer.phone,
          address: customer.address || defaultCustomer.address
        };

        // Ensure products array is properly formatted
        order.products = Array.isArray(order.products) ? order.products.map((product: any) => ({
          productId: product.productId || product.id || '',
          name: product.name || 'Unknown Product',
          price: Number(product.price) || 0,
          quantity: Number(product.quantity) || 1,
          size: product.size || 'N/A',
          image: product.image || ''
        })) : [];

        // Ensure totalAmount is a number
        order.totalAmount = Number(order.totalAmount || order.total) || 0;

        return order;
      }).filter(Boolean); // Remove any null orders
      
      console.log('Validated orders:', validatedOrders);
      setOrders(validatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setOrdersError(axiosError.response?.data?.error || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await axios.put(`${config.apiUrl}/orders`, {
        _id: orderId,
        status: newStatus,
      });
      
      if (response.data) {
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        );
        setOrders(updatedOrders);
        toast.success('Order status updated successfully');
        // Refresh dashboard stats after updating an order
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await axios.delete(`${config.apiUrl}/orders?id=${orderId}`);
      setOrders(orders.filter(order => order._id !== orderId));
      toast.success('Order deleted successfully');
      // Refresh dashboard stats after deleting an order
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    if (!order) return false;

    const matchesSearch = searchQuery === '' || (
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Settings functionality
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      // Add your profile update logic here
      toast.success('Profile updated successfully');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error updating profile:', error);
      toast.error(axiosError.response?.data?.error || 'Failed to update profile');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setSettingsLoading(true);
      const response = await axios.put('/api/settings/otp-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('OTP password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error updating OTP password:', error);
      toast.error(axiosError.response?.data?.error || 'Failed to update OTP password');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Nav />
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-[80vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen">
        <Nav />
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 bg-gray-100 p-1 rounded-md flex">
              <button 
                onClick={() => setActiveSection('dashboard')} 
                className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeSection === 'dashboard' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveSection('orders')} 
                className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeSection === 'orders' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveSection('settings')} 
                className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeSection === 'settings' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Settings
              </button>
            </div>
            
            {activeSection === 'dashboard' && (
              <div className="text-center py-8">
                <div className="text-center text-red-500">Dashboard data is not available</div>
                <button 
                  onClick={fetchDashboardStats} 
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
                >
                  Retry Loading Data
                </button>
              </div>
            )}
            
            {activeSection === 'orders' && (
              <div className="w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
                <div className="bg-white rounded-lg shadow p-6">
                  {/* Orders content - this should still work even if dashboard stats failed to load */}
                  {/* Copy the existing orders content here */}
                </div>
              </div>
            )}
            
            {activeSection === 'settings' && (
              <div className="w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
                <div className="bg-white rounded-lg shadow">
                  {/* Settings content - this should still work even if dashboard stats failed to load */}
                  {/* Copy the existing settings content here */}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const renderDashboardContent = () => {
    if (isLoading || !stats) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    // Calculate percentage of monthly goal - use the current monthlyGoal state which is guaranteed to be updated
    const goalPercentage = Math.min(Math.round((stats.currentMonthSales / monthlyGoal) * 100), 100);
    console.log('Current month sales:', stats.currentMonthSales, 'Monthly goal:', monthlyGoal, 'Percentage:', goalPercentage);

    // Add CSS variables for dark mode support
    return (
      <div className="space-y-8 
        [--graph-stroke:#000] 
        [--graph-fill:rgba(0,0,0,0.3)] 
        [--tooltip-bg:#fff]
        [--tooltip-text:#000]
        [--tooltip-border:#ccc]
        dark:[--graph-stroke:#fff] 
        dark:[--graph-fill:rgba(255,255,255,0.3)]
        dark:[--tooltip-bg:#000]
        dark:[--tooltip-text:#fff]
        dark:[--tooltip-border:#333]">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Orders Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Total Orders</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{stats.totalOrders}</div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-black dark:text-white"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"></path>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                  </svg>
                </div>
              </div>
              <a 
                href="/orders"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                View Real Orders
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>

          {/* Products Card */}
          

          {/* Categories Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Categories</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{stats.totalCategories}</div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-black dark:text-white"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
              </div>
              <a 
                href="/categories"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Categories
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>

          {/* Products Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Products</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{stats.activeProducts}</div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-black dark:text-white"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
              </div>
              <a
                href="/products"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Products
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>
          
          {/* Site Status Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Site Status</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${siteStatus.active ? 'bg-black dark:bg-white' : 'bg-black/50 dark:bg-white/50'}`}></div>
                <div className="font-medium text-black dark:text-white">
                  {siteStatus.active ? 'ACTIVE' : 'MAINTENANCE MODE'}
                </div>
              </div>
              <a
                href="/settings"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Settings
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>

          {/* Waitlist Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Waitlist Subscribers</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{waitlistCount}</div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-black dark:text-white"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              <a
                href="/dashboard/waitlist"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                View Waitlist
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>

          {/* Ambassadors Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Ambassadors</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{ambassadorsCount}</div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-black dark:text-white"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              {Number(pendingAmbassadorsCount) > 0 && (
                <div className="mt-2 bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md text-xs font-medium text-black dark:text-white inline-block">
                  {pendingAmbassadorsCount} pending application{pendingAmbassadorsCount !== 1 ? 's' : ''}
                </div>
              )}
              <a
                href="/ambassadors"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Ambassadors
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>
        </div>

        {/* Monthly Sales Goal */}
        <CardUI className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10">
          <CardHeaderUI className="pb-2 flex justify-between items-center">
            <div>
              <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Monthly Sales Goal</CardTitleUI>
              <CardDescription className="text-black/70 dark:text-white/70">Current progress toward monthly goal</CardDescription>
            </div>
            {isEditingGoal ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingGoal(false);
                    setMonthlyGoal(stats.monthlyGoal); // Reset to original value
                  }}
                  className="px-2 py-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
                  disabled={isSavingGoal}
                >
                  Cancel
                </button>
                <button
                  onClick={updateMonthlySalesGoal}
                  className="px-3 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-black/80 dark:hover:bg-white/80 disabled:opacity-50"
                  disabled={isSavingGoal}
                >
                  {isSavingGoal ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingGoal(true)}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
              >
                Edit Goal
              </button>
            )}
          </CardHeaderUI>
          <CardContentUI>
            <div className="space-y-2">
              {isEditingGoal ? (
                <div>
                  <label htmlFor="monthlyGoal" className="text-sm font-medium text-black dark:text-white block mb-1">
                    Monthly Goal (L.E)
                  </label>
                  <input
                    type="number"
                    id="monthlyGoal"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-black/20 dark:border-white/20 rounded-md shadow-sm focus:outline-none focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white bg-white dark:bg-black text-black dark:text-white"
                    placeholder="Enter goal amount"
                    min="0"
                    disabled={isSavingGoal}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-black dark:text-white">L.E {stats.currentMonthSales.toLocaleString()}</span>
                    <span className="text-sm font-medium text-black dark:text-white">L.E {monthlyGoal.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black dark:bg-white rounded-full" 
                      style={{ width: `${goalPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-black/70 dark:text-white/70">
                    <span>{goalPercentage}% of monthly goal</span>
                    <span>Goal: L.E {monthlyGoal.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </CardContentUI>
        </CardUI>

        {/* Monthly Sales Chart */}
        <CardUI className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10">
          <CardHeaderUI>
            <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Monthly Sales Overview</CardTitleUI>
            <CardDescription className="text-black/70 dark:text-white/70">Performance over the last year</CardDescription>
          </CardHeaderUI>
          <CardContentUI>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.monthlyData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000020" className="dark:stroke-[#FFFFFF20]" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--graph-stroke, #000)" 
                    tick={{ fill: 'var(--graph-stroke, #000)' }}
                  />
                  <YAxis 
                    stroke="var(--graph-stroke, #000)" 
                    tick={{ fill: 'var(--graph-stroke, #000)' }}
                    domain={[0, monthlyGoal]} 
                  />
                  <Tooltip 
                    formatter={(value) => [`L.E ${value}`, 'Sales']} 
                    wrapperClassName="dark:bg-black dark:text-white dark:border-white/20"
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      color: 'var(--tooltip-text, #000)',
                      border: '1px solid var(--tooltip-border, #ccc)'
                    }}
                  />
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(0,0,0,0.8)" className="dark:stop-color-white" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgba(0,0,0,0.2)" className="dark:stop-color-white" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#000000" 
                    fill="url(#colorSales)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    style={{
                      stroke: 'var(--graph-stroke, #000)',
                      fill: 'var(--graph-fill, rgba(0,0,0,0.3))'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContentUI>
        </CardUI>

        {/* Recent Orders */}
        <CardUI className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10">
          <CardHeaderUI>
            <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Recent Orders</CardTitleUI>
            <CardDescription className="text-black/70 dark:text-white/70">Latest orders across your store</CardDescription>
          </CardHeaderUI>
          <CardContentUI>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Order ID</th>
                    <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Customer</th>
                    <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Date</th>
                    <th className="px-4 py-2 text-right font-medium text-black dark:text-white">Amount</th>
                    <th className="px-4 py-2 text-right font-medium text-black dark:text-white"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-4 py-2 text-black dark:text-white">{order._id.slice(-6)}</td>
                        <td className="px-4 py-2 text-black dark:text-white">{order.customerName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-black/70 dark:text-white/70">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-right font-medium text-black dark:text-white">L.E {order.total.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">
                                        <a
                href={`/orders/${order._id}`}
                className="text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
              >
                View
              </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {stats.recentOrders.length > 0 && (
              <div className="mt-4 text-center">
                              <a
                href="/test"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                View All Orders
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
              </div>
            )}
          </CardContentUI>
        </CardUI>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation for pages */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-md flex flex-col sm:flex-row">
            <div 
              className="flex-1 py-10 px-4 rounded-sm text-sm font-medium mb-1 sm:mb-0 bg-black text-white dark:bg-gray-900 text-center"
            >
              Dashboard
            </div>
            <a 
              href="/test" 
              className="flex-1 py-2 px-4 rounded-sm text-sm font-medium mb-1 sm:mb-0 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-center"
            >
              Orders
            </a>
            <a 
              href="/test-settings" 
              className="flex-1 py-2 px-4 rounded-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 text-center"
            >
              Settings
            </a>
          </div>

          {/* Content based on active section */}
          {activeSection === 'dashboard' && renderDashboardContent()}
          
          {activeSection === 'orders' && (
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <Input
                      type="search"
                      placeholder="Search orders..."
                      className="w-full sm:w-[300px] px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                      <SelectTrigger className="w-full sm:w-[200px] px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order._id.substring(0, 8)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                              <div className="text-sm text-gray-500">{order.customer.email}</div>
                              <div className="text-sm text-gray-500">{order.customer.phone || order.phone || 'No phone'}</div>
                              <div className="text-sm text-gray-500">{order.customer.address || order.address || 'No address'}</div>
                              {order.apartmentNumber && <div className="text-sm text-gray-500">Apt: {order.apartmentNumber}</div>}
                              {order.city && <div className="text-sm text-gray-500">City: {order.city}</div>}
                              {order.products?.length > 0 && (
                                <div className="text-sm text-gray-500 mt-2">
                                  <strong>Products:</strong>
                                  <ul className="list-disc pl-5">
                                    {order.products.map((item) => (
                                      <li key={item.productId || Math.random()}>
                                        {item.name} - {item.size || 'N/A'} x {item.quantity} - L.E {item.price.toFixed(2)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              L.E {order.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Select
                                value={order.status}
                                onValueChange={(value: Order['status']) => updateOrderStatus(order._id, value)}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => deleteOrder(order._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-center text-gray-500">
                    {filteredOrders.length === 0 && !ordersLoading && (
                      <p>No orders found. {statusFilter !== 'all' ? 'Try changing the status filter.' : ''}</p>
                    )}
                    {ordersLoading && (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 space-y-8">
                  {/* Profile Settings Card */}
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-4">Profile Settings</h2>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="Enter your first name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            placeholder="Enter your last name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            value={profileData.lastName}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md"
                        disabled={settingsLoading}
                      >
                        {settingsLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>

                  {/* Password Settings Card */}
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-4">OTP Password Settings</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Current OTP Password
                        </label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          placeholder="Enter current OTP password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New OTP Password
                        </label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          placeholder="Enter new OTP password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New OTP Password
                        </label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm new OTP password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md"
                        disabled={settingsLoading}
                      >
                        {settingsLoading ? 'Updating...' : 'Update OTP Password'}
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 text-center text-gray-500">
                    <p>Visit the Settings page for full functionality once we fix the routing issue.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
