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
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";

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
  pendingOrders?: number;
  processingOrders?: number;
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
  inventory?: {
    total: number;
    variants: Array<{
      size: string;
      color: string;
      quantity: number;
    }>;
  };
}

interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
  inventoryUpdated?: boolean;
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
  paymentMethod?: 'cash' | 'instapay';
  transactionScreenshot?: string;
  paymentVerified?: boolean;
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
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [productFilterValue, setProductFilterValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceResult, setMaintenanceResult] = useState<any>(null);

  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  
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
  const [newsletterCount, setNewsletterCount] = useState(0);
  
  // Site status
  const [siteStatus, setSiteStatus] = useState({ active: true, message: '' });
  
  useEffect(() => {
    fetchDashboardStats();
    fetchSiteStatus();
    fetchWaitlistCount();
    fetchAmbassadorsCount();
    fetchNewsletterCount();
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
      fetchNewsletterCount();
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
      
      // Ensure all 12 months are included in the monthly data
      const completeMonthlyData = ensureAllMonthsIncluded(response.data.monthlyData || []);
      const updatedStats = {
        ...response.data,
        monthlyData: completeMonthlyData
      };
      
      setStats(updatedStats);
      
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
      const completeMonthlyData = ensureAllMonthsIncluded(fallbackStats.monthlyData || []);
      const updatedFallbackStats = {
        ...fallbackStats,
        monthlyData: completeMonthlyData
      };
      
      setStats(updatedFallbackStats);
      setMonthlyGoal(updatedFallbackStats.monthlyGoal);
      
      // Still show the error toast
      toast.error(`Failed to load dashboard data: ${errorDetails}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch waitlist count from real-time API
  const fetchWaitlistCount = async () => {
    try {
      setWaitlistLoading(true);
      const response = await axios.get('/api/waitlist');
      if (response.data && response.data.total) {
        setWaitlistCount(response.data.total);
        console.log('Waitlist count fetched:', response.data.total);
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

  // Fetch newsletter subscribers count
  const fetchNewsletterCount = async () => {
    try {
      setNewsletterLoading(true);
      const response = await axios.get('/api/newsletter?subscribed=true');
      if (response.data && typeof response.data.count === 'number') {
        setNewsletterCount(response.data.count);
        console.log('Newsletter subscribers count fetched:', response.data.count);
      } else {
        console.error('Error in newsletter subscribers response:', response.data);
        // Default to 0 if there's an issue
        setNewsletterCount(0);
      }
    } catch (error) {
      console.error('Error fetching newsletter subscribers count:', error);
      setNewsletterCount(0);
    } finally {
      setNewsletterLoading(false);
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
              color: product.color || product.variant || '',
              image: product.image || '',
              inventoryUpdated: product.inventoryUpdated || false
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
          color: product.color || product.variant || '',
          image: product.image || '',
          inventoryUpdated: product.inventoryUpdated || false
        })) : [];

        // Ensure totalAmount is a number
        order.totalAmount = Number(order.totalAmount || order.total) || 0;

        return order;
      }).filter(Boolean); // Remove any null orders
      
      console.log('Validated orders:', validatedOrders);
      setOrders(validatedOrders);
      
      // Check for pending inventory updates
      checkPendingInventoryUpdates(validatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setOrdersError(axiosError.response?.data?.error || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Check for orders that need inventory updates
  const checkPendingInventoryUpdates = async (ordersList: Order[]) => {
    try {
      // Find orders that need inventory updates (processing, shipped, delivered status)
      // Also include new orders that haven't been processed yet
      const ordersNeedingUpdates = ordersList.filter(order => {
        // Check if this is a newly created order in pending status
        const isNewPendingOrder = order.status === 'pending' && 
                               order.products.some(item => !item.inventoryUpdated) &&
                               new Date(order.createdAt).getTime() > Date.now() - (1 * 60 * 60 * 1000); // Created in the last hour
          
        // Check if this is a processed order that needs inventory updates
        const isProcessedOrder = (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') &&
                              order.products.some(item => !item.inventoryUpdated);
          
        return isNewPendingOrder || isProcessedOrder;
      });
      
      if (ordersNeedingUpdates.length > 0) {
        console.log(`Found ${ordersNeedingUpdates.length} orders needing inventory updates`);
        
        // Process each order silently in the background
        for (const order of ordersNeedingUpdates) {
          console.log(`Auto-processing inventory update for order ${order._id}`);
          await updateInventoryFromOrder(order);
        }
      } else {
        console.log('No pending inventory updates found');
      }
    } catch (error) {
      console.error('Error checking pending inventory updates:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], paymentVerified?: boolean) => {
    try {
      const updateData: any = {
        _id: orderId,
        status: newStatus,
      };
      
      // If paymentVerified is provided, update that field too
      if (paymentVerified !== undefined) {
        updateData.paymentVerified = paymentVerified;
      }
      
      const response = await axios.put(`${config.apiUrl}/orders`, updateData);
      
      if (response.data) {
        const updatedOrders = orders.map(order => {
          if (order._id === orderId) {
            const updatedOrder = { ...order, status: newStatus };
            if (paymentVerified !== undefined) {
              updatedOrder.paymentVerified = paymentVerified;
            }
            return updatedOrder;
          }
          return order;
        });
        setOrders(updatedOrders);
        toast.success('Order updated successfully');
        // Refresh dashboard stats after updating an order
        fetchDashboardStats();
        
        // If the order status is changed to 'processing', reduce inventory
        const order = orders.find(o => o._id === orderId);
        if (newStatus === 'processing' && order) {
          updateInventoryFromOrder(order);
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  // Function to update inventory when an order is processed
  const updateInventoryFromOrder = async (order: Order) => {
    try {
      // Skip if order products don't have necessary information
      if (!order.products || order.products.length === 0) {
        console.warn('Order has no products to update inventory for', order._id);
        return;
      }

      console.log('Processing inventory update for order:', order._id);
      
      // Use the new inventory service API endpoint
      const response = await axios.post(`${config.apiUrl}/inventory/update-from-order`, {
        orderId: order._id
      });
      
      if (response.data.success) {
        toast.success('Inventory updated successfully');
        console.log('Inventory update results:', response.data);
      } else {
        toast.error('Some inventory updates failed');
        console.error('Inventory update errors:', response.data.errors);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
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

  // Fix payment status and update inventory
  const fixPaymentStatus = async () => {
    try {
      setMaintenanceLoading(true);
      setMaintenanceResult(null);
      
      const response = await fetch('/api/orders/fix-payment-status');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fix payment status');
      }
      
      const data = await response.json();
      setMaintenanceResult(data);
      
      // Show success message
      if (data.payment?.ordersFixed > 0) {
        toast.success(`Fixed ${data.payment.ordersFixed} orders with payment issues`);
      } else {
        toast.success('No payment issues found');
      }
      
      // Refresh dashboard data
      if (typeof fetchOrders === 'function') {
        fetchOrders();
      }
      if (typeof fetchDashboardStats === 'function') {
        fetchDashboardStats();
      }
    } catch (error: any) {
      console.error('Error fixing payment status:', error);
      toast.error(error.message || 'Failed to fix payment status');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Add this function to fix inventory structures
  const fixInventoryStructures = async () => {
    try {
      setIsLoading(true);
      toast.success('Starting inventory fix process...');
      
      const response = await axios.get(`${config.apiUrl}/inventory/fix?all=true`);
      
      if (response.data.success) {
        toast.success(`Fixed ${response.data.updated} of ${response.data.processed} products`);
        console.log('Inventory fix results:', response.data);
        
        // Refresh data
        fetchDashboardStats();
        fetchOrders();
      } else {
        toast.error('Failed to fix inventory structures');
      }
    } catch (error) {
      console.error('Error fixing inventory:', error);
      toast.error('Failed to fix inventory');
    } finally {
      setIsLoading(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
              <button 
                onClick={() => router.push('/orders')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                View Real Orders
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
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
              <button 
                onClick={() => router.push('/categories')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Categories
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
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
              <button 
                onClick={() => router.push('/products')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Products
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
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
              <button 
                onClick={() => router.push('/settings')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Settings
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>

          {/* Waitlist Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Waitlist Subscribers</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">
                  {waitlistLoading ? (
                    <div className="flex items-center h-8">
                      <div className="animate-pulse w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ) : (
                    waitlistCount
                  )}
                </div>
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
              <button 
                onClick={() => router.push('/dashboard/waitlist')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                View Waitlist
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </CardContentUI>
          </CardUI>

          {/* Newsletter Subscribers Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Newsletter Subscribers</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">
                  {newsletterLoading ? (
                    <div className="flex items-center h-8">
                      <div className="animate-pulse w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ) : (
                    newsletterCount
                  )}
                </div>
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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/newsletter')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                Manage Subscribers
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
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
              <button 
                onClick={() => router.push('/ambassadors')}
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
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
                  <p className="text-xs text-black/70 dark:text-white/70 mt-2">
                    Current month sales: L.E {stats.currentMonthSales.toLocaleString()}
                  </p>
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
                    left: 10,
                    bottom: 50,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-[rgba(255,255,255,0.1)]" />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor"
                    className="text-black dark:text-white"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickSize={8}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis 
                    stroke="currentColor"
                    className="text-black dark:text-white" 
                    tick={{ fill: 'currentColor' }}
                    domain={[0, Math.max(100000, monthlyGoal, stats.currentMonthSales * 1.2)]}
                  />
                  <Tooltip 
                    formatter={(value) => [`L.E ${value}`, 'Sales']} 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      color: '#000000',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{
                      color: '#000000'
                    }}
                    wrapperClassName="dark:bg-black dark:text-white"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="currentColor" 
                    fill="currentColor" 
                    strokeWidth={2}
                    fillOpacity={0.3} 
                    className="text-black dark:text-white" 
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
                          <button
                            onClick={() => router.push(`/orders/${order._id}`)}
                            className="text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
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

        {/* Order Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="dark:bg-black dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats.pendingOrders}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Require confirmation</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-black dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Processing Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats.processingOrders}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Being prepared</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-black dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{Array.isArray(stats.recentOrders) ? stats.recentOrders.length : 0}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
        
        {/* System Maintenance Section */}
        <Card className="mb-8 dark:bg-black dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">System Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={() => router.push('/dashboard/inventory')}
                >
                  Inventory Management
                </Button>
                <Button 
                  variant="outline"
                  className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={() => router.push('/dashboard/inventory-fix')}
                >
                  Inventory Fix Utility
                </Button>
                <Button 
                  variant="outline"
                  className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={fixPaymentStatus}
                  disabled={maintenanceLoading}
                >
                  {maintenanceLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing Payment Status...
                    </>
                  ) : 'Fix Payment Status'}
                </Button>
                <Button 
                  variant="outline"
                  className="dark:bg-red-700 dark:text-white dark:border-red-700 dark:hover:bg-red-900"
                  onClick={async () => {
                    try {
                      setMaintenanceLoading(true);
                      toast.loading('Running emergency fix...');
                      
                      const response = await fetch('/api/inventory/manual-fix');
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to apply emergency fix');
                      }
                      
                      const result = await response.json();
                      
                      if (result.success) {
                        toast.dismiss();
                        toast.success(`Emergency fix applied! Old stock: ${result.results.oldStock}, New stock: ${result.results.newStock}`);
                        console.log('Emergency fix result:', result);
                      } else {
                        toast.error('Emergency fix failed');
                      }
                    } catch (error: any) {
                      console.error('Error applying emergency fix:', error);
                      toast.error(error.message || 'Failed to apply emergency fix');
                    } finally {
                      setMaintenanceLoading(false);
                    }
                  }}
                  disabled={maintenanceLoading}
                >
                  {maintenanceLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Emergency Fix...
                    </>
                  ) : 'Emergency Fix for #682810585'}
                </Button>
                <Button 
                  variant="outline"
                  className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={async () => {
                    try {
                      setMaintenanceLoading(true);
                      setMaintenanceResult(null);
                      
                      const response = await fetch('/api/orders/fix-all-screenshots');
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to fix payment screenshots');
                      }
                      
                      const data = await response.json();
                      setMaintenanceResult(data);
                      
                      // Show success message
                      if (data.results?.ordersFixed > 0) {
                        toast.success(`Fixed ${data.results.ordersFixed} orders with screenshot issues`);
                      } else {
                        toast.success('No screenshot issues found');
                      }
                      
                      // Refresh data
                      if (typeof fetchOrders === 'function') {
                        fetchOrders();
                      }
                      if (typeof fetchDashboardStats === 'function') {
                        fetchDashboardStats();
                      }
                    } catch (error: any) {
                      console.error('Error fixing payment screenshots:', error);
                      toast.error(error.message || 'Failed to fix payment screenshots');
                    } finally {
                      setMaintenanceLoading(false);
                    }
                  }}
                  disabled={maintenanceLoading}
                >
                  {maintenanceLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing Screenshots...
                    </>
                  ) : 'Fix All Payment Screenshots'}
                </Button>
              </div>
              
              {maintenanceResult && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-800">
                  <h3 className="font-medium mb-2 dark:text-white">Maintenance Results</h3>
                  <div className="space-y-2 text-sm dark:text-gray-300">
                    <p>Message: {maintenanceResult.message}</p>
                    <p>Orders fixed: {maintenanceResult.payment?.ordersFixed || 0}</p>
                    <p>Inventory updates: {maintenanceResult.inventory?.successfulUpdates || 0} successful, {maintenanceResult.inventory?.failedUpdates || 0} failed</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Tools Card */}
        <Card className="mb-8 dark:bg-black dark:border-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Inventory Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                onClick={fixInventoryStructures} 
                disabled={isLoading}
                className="w-full dark:bg-gray-700 dark:text-white"
              >
                {isLoading ? 'Processing...' : 'Fix Inventory Structures'}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resolves inconsistencies between different inventory schemas and ensures all products use a standardized structure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation for pages */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-md flex flex-col sm:flex-row">
            <button 
              onClick={() => setActiveSection('dashboard')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium mb-1 sm:mb-0 ${activeSection === 'dashboard' ? 'bg-black text-white dark:bg-gray-900' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {
                setActiveSection('orders');
                router.push('/orders');
              }} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium mb-1 sm:mb-0 ${activeSection === 'orders' ? 'bg-black text-white dark:bg-gray-900' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveSection('settings')} 
              className={`flex-1 py-2 px-4 rounded-sm text-sm font-medium ${activeSection === 'settings' ? 'bg-black text-white dark:bg-gray-900' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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

                  {/* Inventory Management Button */}
                  <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Management</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      When orders are processed, inventory is automatically reduced. 
                      Click the button below to ensure all processed orders have properly updated inventory.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          // Get all processing orders
                          const processingOrders = orders.filter(order => 
                            order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered'
                          );
                          
                          if (processingOrders.length === 0) {
                            toast.success('No orders to update inventory for');
                            return;
                          }
                          
                          // Show loading toast
                          toast.loading(`Updating inventory for ${processingOrders.length} orders...`);
                          
                          // Process each order
                          for (const order of processingOrders) {
                            await updateInventoryFromOrder(order);
                          }
                          
                          // Dismiss loading toast and show success
                          toast.dismiss();
                          toast.success(`Inventory updated for ${processingOrders.length} orders`);
                          
                          // Refresh data
                          fetchDashboardStats();
                          fetchOrders();
                        } catch (error) {
                          console.error('Error in batch inventory update:', error);
                          toast.error('Failed to update inventory');
                        }
                      }}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Update Inventory from Orders
                    </button>
                  </div>

                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
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
                                        {item.name} - {item.size || 'N/A'} 
                                        {item.color ? ` (${item.color})` : ''} 
                                        x {item.quantity} - L.E {item.price.toFixed(2)}
                                        {item.inventoryUpdated && (
                                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                                            Inventory Updated
                                          </span>
                                        )}
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
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {order.paymentMethod === 'instapay' ? 'InstaPay' : 'Cash on Delivery'}
                                </span>
                                
                                {order.paymentMethod === 'instapay' && (
                                  <>
                                    {order.transactionScreenshot && (
                                      <a 
                                        href={order.transactionScreenshot} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect width="18" height="14" x="3" y="5" rx="2" />
                                          <path d="M10 2v4" />
                                          <path d="M14 2v4" />
                                          <path d="M10 16v4" />
                                          <path d="M14 16v4" />
                                          <path d="M2 10h20" />
                                        </svg>
                                        View Payment Screenshot
                                      </a>
                                    )}
                                    
                                    <div className="flex items-center mt-1">
                                      <input
                                        type="checkbox"
                                        id={`verify-${order._id}`}
                                        checked={order.paymentVerified || false}
                                        onChange={() => {
                                          const newVerifiedStatus = !order.paymentVerified;
                                          // Update order payment verification status using our existing function
                                          updateOrderStatus(order._id, order.status, newVerifiedStatus);
                                        }}
                                        className="h-4 w-4 text-green-600"
                                      />
                                      <label htmlFor={`verify-${order._id}`} className="ml-2 text-xs text-gray-700">
                                        {order.paymentVerified ? 'Payment Verified' : 'Mark as Verified'}
                                      </label>
                                    </div>
                                  </>
                                )}
                              </div>
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

// Update month names to full names instead of abbreviations
const ensureAllMonthsIncluded = (monthlyData: Array<{name: string, sales: number}>) => {
  // Define all months in order with full names
  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Short month names (3 letters) used in the API
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Create a map of existing data
  const dataMap = new Map();
  monthlyData.forEach(item => {
    // If data is provided with short month names, we need to map them to full names
    const monthIndex = shortMonths.findIndex(m => m === item.name);
    if (monthIndex !== -1) {
      dataMap.set(allMonths[monthIndex], item.sales);
    } else {
      // If it's already a full month name or something else
      dataMap.set(item.name, item.sales);
    }
  });
  
  // Create complete data with full month names in calendar order
  const completeData = allMonths.map(month => ({
    name: month,
    sales: dataMap.has(month) ? dataMap.get(month) : 0
  }));
  
  return completeData;
};
