'use client';

import { useState, useEffect } from 'react';
import Nav from "../sections/nav";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { useRouter } from 'next/navigation';
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
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  
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

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Use absolute URL for API calls
      const apiUrl = window.location.origin + '/api/dashboard';
      console.log('Fetching dashboard data from:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('Dashboard data received:', response.data);
      setStats(response.data);
      
      // Set monthly goal from API response if available
      if (response.data?.monthlyGoal) {
        setMonthlyGoal(response.data.monthlyGoal);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Extract more detailed error information
      const axiosError = error as AxiosError<{ error: string }>;
      const errorDetails = axiosError.response?.data?.error || 'Unknown error';
      const statusCode = axiosError.response?.status;
      
      console.error('Error details:', {
        message: errorDetails,
        status: statusCode,
        url: '/api/dashboard'
      });
      
      // Try the diagnostic endpoint to get more info
      try {
        const diagnosticUrl = window.location.origin + '/api/diagnose';
        console.log('Fetching diagnostic data from:', diagnosticUrl);
        const diagResponse = await axios.get(diagnosticUrl);
        console.log('Diagnostic data:', diagResponse.data);
      } catch (diagError) {
        console.error('Diagnostic endpoint error:', diagError);
      }
      
      // Use fallback data instead of showing error
      setStats(fallbackStats);
      setMonthlyGoal(fallbackStats.monthlyGoal);
      
      // Still show the error toast
      toast.error(`Failed to load dashboard data: ${errorDetails}`);
    } finally {
      setIsLoading(false);
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
  
  // Fetch waitlist count
  const fetchWaitlistCount = async () => {
    try {
      const response = await axios.get('/api/waitlist/count');
      if (response.data.success && typeof response.data.count === 'number') {
        setWaitlistCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching waitlist count:', error);
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
      
      // Make API call to update the monthly goal
      await axios.post('/api/dashboard/update-goal', { monthlyGoal });
      
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

    // Calculate percentage of monthly goal
    const goalPercentage = Math.min(Math.round((stats.currentMonthSales / monthlyGoal) * 100), 100);

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Card */}
          <CardUI className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Total Orders</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <div className={`p-2 rounded-full ${statusFilter === 'pending' ? 'bg-amber-100' : 'bg-slate-100 dark:bg-black/80'}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-gray-600"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"></path>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                  </svg>
                </div>
              </div>
              <button 
                onClick={() => router.push('/orders')}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
              >
                View Orders
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>

          {/* Products Card */}
          <DarkModePanel className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Products</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
                <div className="p-2 rounded-full bg-slate-100 dark:bg-black/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-gray-600 dark:text-gray-300"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
              </div>
              <button 
                onClick={() => router.push('/products')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2 inline-flex items-center"
              >
                Manage Products
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </DarkModePanel>

          {/* Categories Card */}
          <CardUI className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Categories</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <div className="p-2 rounded-full bg-slate-100 dark:bg-black/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-gray-600"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
              </div>
              <button 
                onClick={() => router.push('/categories')}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
              >
                Manage Categories
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>

          {/* Total Sales Card */}
          <CardUI className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Total Sales</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">L.E {stats.totalSales.toLocaleString()}</div>
                <div className="p-2 rounded-full bg-green-100 dark:bg-black/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-green-600"
                  >
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                This Month: L.E {stats.currentMonthSales.toLocaleString()}
              </div>
            </CardContentUI>
          </CardUI>
        </div>

        {/* Second Row - Site Status, Waitlist, Ambassadors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Site Status Card */}
          <DarkModePanel className={`shadow-sm hover:shadow-md transition-shadow ${siteStatus.active ? '' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Site Status</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${siteStatus.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <DarkModeStatus status={siteStatus.active ? 'success' : 'error'} className="font-medium">
                  {siteStatus.active ? 'ACTIVE' : 'MAINTENANCE MODE'}
                </DarkModeStatus>
              </div>
              <button 
                onClick={() => router.push('/settings')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2 inline-flex items-center"
              >
                Manage Settings
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </DarkModePanel>

          {/* Waitlist Card */}
          <CardUI className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Waitlist Subscribers</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{waitlistCount}</div>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-black/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-blue-600"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/waitlist')}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
              >
                View Waitlist
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>

          {/* Ambassadors Card */}
          <CardUI className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium">Ambassadors</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{ambassadorsCount}</div>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-black/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-purple-600"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              {pendingAmbassadorsCount > 0 && (
                <div className="mt-2 bg-amber-100 px-2 py-1 rounded-md text-xs font-medium text-amber-800 inline-block">
                  {pendingAmbassadorsCount} pending application{pendingAmbassadorsCount !== 1 ? 's' : ''}
                </div>
              )}
              <button 
                onClick={() => router.push('/ambassadors')}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
              >
                Manage Ambassadors
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>
        </div>

        {/* Monthly Sales Goal */}
        <CardUI className="bg-white shadow-sm">
          <CardHeaderUI className="pb-2 flex justify-between items-center">
            <div>
              <CardTitleUI className="text-lg font-semibold">Monthly Sales Goal</CardTitleUI>
              <CardDescription>Current progress toward monthly goal</CardDescription>
            </div>
            {isEditingGoal ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditingGoal(false);
                    setMonthlyGoal(stats.monthlyGoal); // Reset to original value
                  }}
                  className="px-2 py-1 text-gray-600 hover:text-gray-800"
                  disabled={isSavingGoal}
                >
                  Cancel
                </button>
                <button
                  onClick={updateMonthlySalesGoal}
                  className="px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                  disabled={isSavingGoal}
                >
                  {isSavingGoal ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit Goal
              </button>
            )}
          </CardHeaderUI>
          <CardContentUI>
            <div className="space-y-2">
              {isEditingGoal ? (
                <div>
                  <label htmlFor="monthlyGoal" className="text-sm font-medium text-gray-700 block mb-1">
                    Monthly Goal (L.E)
                  </label>
                  <input
                    type="number"
                    id="monthlyGoal"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter monthly goal amount"
                    min="0"
                    step="1000"
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">L.E {stats.currentMonthSales.toLocaleString()}</span>
                    <span className="text-sm font-medium text-gray-700">L.E {monthlyGoal.toLocaleString()}</span>
                  </div>
                  <Progress value={goalPercentage} className="w-full h-2.5" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{goalPercentage}% of monthly goal</span>
                    <span>Goal: L.E {monthlyGoal.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </CardContentUI>
        </CardUI>

        {/* Monthly Sales Chart */}
        <CardUI className="bg-white shadow-sm">
          <CardHeaderUI>
            <CardTitleUI className="text-lg font-semibold">Monthly Sales Overview</CardTitleUI>
            <CardDescription>Performance over the last year</CardDescription>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`L.E ${value}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContentUI>
        </CardUI>

        {/* Recent Orders */}
        <CardUI className="bg-white shadow-sm">
          <CardHeaderUI>
            <CardTitleUI className="text-lg font-semibold">Recent Orders</CardTitleUI>
            <CardDescription>Latest orders across your store</CardDescription>
          </CardHeaderUI>
          <CardContentUI>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Order ID</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{order._id.substring(0, 8)}...</td>
                        <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">L.E {order.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => router.push(`/orders?id=${order._id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
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
                <button
                  onClick={() => router.push('/orders')}
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  View All Orders
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </button>
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
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation for pages */}
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
