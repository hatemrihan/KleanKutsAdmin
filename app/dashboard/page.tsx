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
  const [monthlyGoal, setMonthlyGoal] = useState(100000);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  
  // Waitlist and Ambassadors state
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [ambassadorsCount, setAmbassadorsCount] = useState(0);
  const [pendingAmbassadorsCount, setPendingAmbassadorsCount] = useState(0);
  
  // Site status
  const [siteStatus, setSiteStatus] = useState({ active: true, message: '' });
  
  // Add selected orders state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const [error, setError] = useState('');
  const [currentMonthSales, setCurrentMonthSales] = useState(0);

  // Add this after the ambassadors count state
  const [videoSubmissions, setVideoSubmissions] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    productVideoLink: string;
    videoSubmissionDate: string;
  }>>([]);

  useEffect(() => {
    // Initial data load
    fetchDashboardStats();
    fetchSiteStatus();
    fetchWaitlistCount();
    fetchProductsAndCategoriesCounts();
    fetchRealSalesData(); // Add initial real sales data fetch
    
    // Set up intervals for auto-refresh - Like big investment companies!
    const dashboardRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardStats();
      fetchRealSalesData(); // Add real sales data refresh
    }, 5000); // Refresh every 5 seconds for real-time updates!
    
    // Additional interval for critical sales data - even faster
    const salesRefreshInterval = setInterval(() => {
      console.log('Fast sales data refresh...');
      fetchRealSalesData();
    }, 3000); // Refresh sales every 3 seconds
    
    // Set up event listeners for order updates
    const handleOrderUpdate = () => {
      console.log('Order update detected, refreshing sales data...');
      fetchRealSalesData();
    };
    
    window.addEventListener('order-created', handleOrderUpdate);
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('order-deleted', handleOrderUpdate);
    
    // Check localStorage for updates
    const orderUpdateCheckInterval = setInterval(() => {
      const needsRefresh = localStorage.getItem('refresh_dashboard_sales');
      if (needsRefresh === 'true') {
        console.log('Sales refresh requested via localStorage');
        fetchRealSalesData();
        localStorage.removeItem('refresh_dashboard_sales');
      }
    }, 5000); // Check every 5 seconds
    
    // Add this to your useEffect that fetches ambassadors
    fetchVideoSubmissions();
    
    return () => {
      clearInterval(dashboardRefreshInterval);
      clearInterval(salesRefreshInterval);
      clearInterval(orderUpdateCheckInterval);
      window.removeEventListener('order-created', handleOrderUpdate);
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('order-deleted', handleOrderUpdate);
    };
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
      console.log('Fetching dashboard stats...');
      
      // Add cache-busting parameter to prevent stale data - AGGRESSIVE CACHE BUSTING FOR DEPLOYMENT
      const timestamp = new Date().getTime();
      const randomId = Math.floor(Math.random() * 1000000);
      const response = await axios.get(`/api/dashboard?_=${timestamp}&r=${randomId}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': '0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Dashboard stats loaded:', response.data);
      
      // Set monthly goal from API response with validation
      if (response.data && typeof response.data.monthlyGoal === 'number' && !isNaN(response.data.monthlyGoal)) {
        setMonthlyGoal(response.data.monthlyGoal);
        console.log('Updated monthly goal from API:', response.data.monthlyGoal);
      } else {
        console.warn('Invalid monthly goal in API response:', response.data?.monthlyGoal);
      }
      
      // Validate current month sales from API response
      if (response.data && typeof response.data.currentMonthSales === 'number' && !isNaN(response.data.currentMonthSales)) {
        console.log('Current month sales from API:', response.data.currentMonthSales);
      } else {
        console.warn('Invalid current month sales in API response:', response.data?.currentMonthSales);
        // Add fallback if current month sales is invalid
        if (response.data) {
          response.data.currentMonthSales = 0;
        }
      }
      
      // Ensure we have proper monthlyData with all months
      if (response.data && (!response.data.monthlyData || response.data.monthlyData.length < 12)) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        response.data.monthlyData = months.map(name => ({ name, sales: 0 }));
        console.log('Created default monthly data structure');
      }
      
      // Set dashboard stats after monthly goal is updated
      setStats(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Create more reliable fallback data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fallbackMonthlyData = months.map(name => ({ name, sales: 0 }));
      
      const enhanced_fallbackStats = {
        ...fallbackStats,
        monthlyData: fallbackMonthlyData
      };
      
      // Use fallback data instead of showing error
      setMonthlyGoal(enhanced_fallbackStats.monthlyGoal);
      setStats(enhanced_fallbackStats);
      
      // Show error toast
      toast.error('Failed to load dashboard data. Showing default values.');
      
      // Try to recover by fetching orders directly
      try {
        const ordersResponse = await axios.get(`${window.location.origin}/api/orders`);
        if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
          const orders = ordersResponse.data;
          console.log('Recovered orders directly:', orders.length);
          
          // Calculate total sales and other stats from orders
          let totalSales = 0;
          orders.forEach(order => {
            if (order.totalAmount) totalSales += Number(order.totalAmount);
            else if (order.total) totalSales += Number(order.total);
          });
          
          // Update stats with the recovered data
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              totalOrders: orders.length,
              totalSales: totalSales,
              recentOrders: orders.slice(0, 5).map(order => ({
                _id: order._id,
                customerName: order.customer?.name || `${order.firstName || ''} ${order.lastName || ''}` || 'Unknown',
                status: order.status || 'pending',
                total: order.totalAmount || order.total || 0,
                createdAt: order.createdAt || new Date().toISOString()
              }))
            };
          });
        }
      } catch (recoveryError) {
        console.error('Recovery attempt also failed:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch waitlist count from real-time API
  const fetchWaitlistCount = async () => {
    try {
      setWaitlistLoading(true);
      // Use our new dedicated endpoint
      const response = await axios.get('/api/waitlist/count');
      
      if (response.data && (response.data.success || typeof response.data.count === 'number')) {
        setWaitlistCount(response.data.count);
        console.log('Waitlist count fetched:', response.data.count);
      } else {
        console.error('Error in waitlist count response:', response.data);
        // Try alternative endpoint if first one fails
        try {
          const altResponse = await axios.get('/api/waitlist');
          if (altResponse.data && Array.isArray(altResponse.data)) {
            setWaitlistCount(altResponse.data.length);
            console.log('Waitlist count fetched from alternative endpoint:', altResponse.data.length);
          } else {
        setWaitlistCount(0);
          }
        } catch (altError) {
          console.error('Alternative waitlist endpoint also failed:', altError);
          setWaitlistCount(0);
        }
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
        const ambassadors = response.data.ambassadors;
        console.log('Fetched ambassadors:', ambassadors.length);
        
        // Update ambassadors count
        setAmbassadorsCount(ambassadors.length);
        
        // Count pending ambassadors
        const pending = ambassadors.filter(
          (ambassador: { status: string }) => ambassador.status === 'pending'
        ).length;
        setPendingAmbassadorsCount(pending);
        
        // Store in localStorage for persistence
        try {
          localStorage.setItem('ambassadorsCount', ambassadors.length.toString());
          localStorage.setItem('pendingAmbassadorsCount', pending.toString());
        } catch (e) {
          console.error('Error storing ambassadors count in localStorage:', e);
        }
      } else {
        console.error('Invalid ambassadors data format:', response.data);
        // Try to use cached count from localStorage
        const cachedCount = localStorage.getItem('ambassadorsCount');
        const cachedPending = localStorage.getItem('pendingAmbassadorsCount');
        if (cachedCount) setAmbassadorsCount(parseInt(cachedCount));
        if (cachedPending) setPendingAmbassadorsCount(parseInt(cachedPending));
      }
    } catch (error) {
      console.error('Error fetching ambassadors count:', error);
      // Try to use cached count from localStorage on error
      const cachedCount = localStorage.getItem('ambassadorsCount');
      const cachedPending = localStorage.getItem('pendingAmbassadorsCount');
      if (cachedCount) setAmbassadorsCount(parseInt(cachedCount));
      if (cachedPending) setPendingAmbassadorsCount(parseInt(cachedPending));
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
      
      // Force update stats with new goal even before API responds
      setStats(prevStats => {
        if (!prevStats) return prevStats;
        return {
          ...prevStats,
          monthlyGoal
        };
      });
      
      // Fetch updated dashboard stats to reflect the new goal
      await fetchDashboardStats();
      
      // Force another update to ensure chart scales properly
      setTimeout(() => {
        // This timeout forces a re-render after the state update cycle
        const chartContainer = document.querySelector('.recharts-responsive-container');
        if (chartContainer) {
          // Trigger resize event to force chart update
          window.dispatchEvent(new Event('resize'));
        }
      }, 100);
      
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
      // Clear selected orders when fetching new orders
      setSelectedOrders([]);
      setSelectAllChecked(false);
      
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
        // Refresh dashboard stats and real sales data after updating an order
        fetchDashboardStats();
        fetchRealSalesData();
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
      fetchRealSalesData();
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

  // Handle select all orders
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAllChecked(e.target.checked);
    if (e.target.checked) {
      // Select all visible filtered orders
      setSelectedOrders(filteredOrders.map(order => order._id));
    } else {
      // Deselect all
      setSelectedOrders([]);
    }
  };

  // Handle individual order selection
  const handleSelectOrder = (orderId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Delete multiple orders
  const deleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) {
      try {
        // Create a loading toast
        const loadingToastId = toast.loading(`Deleting ${selectedOrders.length} order(s)...`);
        
        // Track successful and failed deletions
        let successCount = 0;
        let failCount = 0;
        
        // Delete each order one by one
        for (const orderId of selectedOrders) {
          try {
            await axios.delete(`${config.apiUrl}/orders?id=${orderId}`);
            successCount++;
          } catch (error) {
            console.error(`Error deleting order ${orderId}:`, error);
            failCount++;
          }
        }
        
        // Update the orders list
        setOrders(orders.filter(order => !selectedOrders.includes(order._id)));
        
        // Clear selected orders
        setSelectedOrders([]);
        setSelectAllChecked(false);
        
        // Update toast with results
        toast.dismiss(loadingToastId);
        if (failCount === 0) {
          toast.success(`Successfully deleted ${successCount} order(s)`);
        } else {
          toast.error(`Deleted ${successCount} order(s), failed to delete ${failCount} order(s)`);
        }
        
        // Refresh dashboard stats after deleting orders
        fetchDashboardStats();
        fetchRealSalesData();
      } catch (error) {
        console.error('Error in batch delete operation:', error);
        toast.error('An error occurred during the batch delete operation');
      }
    }
  };

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

  // Add new function to fetch products and categories counts with enhanced error handling
  const fetchProductsAndCategoriesCounts = async () => {
    try {
        const fetchWithRetry = async (url: string, retries = 3) => {
            try {
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                if (retries > 0) {
                    console.log(`Retrying... ${retries} attempts left`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchWithRetry(url, retries - 1);
                }
                throw error;
            }
        };

        // Use the new dedicated endpoint for counts
        const data = await fetchWithRetry('/api/dashboard/counts');
        console.log('Products and Categories counts:', data);

        // Update the stats with the counts
        setStats(prevStats => {
            if (!prevStats) return fallbackStats;
            return {
                ...prevStats,
                activeProducts: data.productCount
            };
        });
    } catch (error) {
        console.error('Error fetching product and category counts:', error);
        toast.error('Failed to fetch product and category counts');
    }
};

  // Improved version to fetch real sales data with better integration with monthly goal
  const fetchRealSalesData = async () => {
    try {
      // AGGRESSIVE CACHE BUSTING FOR REAL-TIME SALES DATA
      const timestamp = new Date().getTime();
      const randomId = Math.floor(Math.random() * 1000000);
      
      const response = await axios.get(`/api/dashboard/real-sales?_=${timestamp}&r=${randomId}`, {
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': '0'
        },
        timeout: 8000 // 8 second timeout for faster updates
      });
      
      if (response.data) {
        setCurrentMonthSales(response.data.currentMonthSales || 0);
        setMonthlyGoal(response.data.monthlyGoal || 100000);
        
        // Update stats with real data
        setStats(prevStats => {
          if (!prevStats) return null;
          return {
            ...prevStats,
            currentMonthSales: response.data.currentMonthSales || 0,
            monthlyGoal: response.data.monthlyGoal || 100000,
            totalSales: response.data.totalSales || prevStats.totalSales,
            totalOrders: response.data.totalOrders || prevStats.totalOrders
          };
        });
        
        console.log('✅ REAL-TIME SALES UPDATED:', {
          currentMonthSales: response.data.currentMonthSales,
          totalSales: response.data.totalSales,
          totalOrders: response.data.totalOrders
        });
      }
    } catch (error) {
      console.error('❌ Error fetching real-time sales data:', error);
    }
  };

  // Add this to your useEffect
  useEffect(() => {
    // Initial fetch
    fetchAmbassadorsCount();
    
    // Set up interval to refresh ambassadors count
    const ambassadorsInterval = setInterval(() => {
      fetchAmbassadorsCount();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(ambassadorsInterval);
    };
  }, []);

  // Add this function to fetch video submissions
  const fetchVideoSubmissions = async () => {
    try {
      const response = await axios.get('/api/ambassadors');
      if (response.data && Array.isArray(response.data.ambassadors)) {
        const submissions = response.data.ambassadors
          .filter((ambassador: any) => ambassador.productVideoLink)
          .map((ambassador: any) => ({
            _id: ambassador._id,
            name: ambassador.name,
            email: ambassador.email,
            productVideoLink: ambassador.productVideoLink,
            videoSubmissionDate: ambassador.videoSubmissionDate || new Date().toISOString()
          }));
        setVideoSubmissions(submissions);
      }
    } catch (error) {
      console.error('Error fetching ambassador links:', error);
    }
  };

  // Add this function to update video status
  const updateVideoStatus = async (ambassadorId: string, status: string) => {
    try {
      const response = await axios.post('/api/ambassadors/update-video-status', {
        ambassadorId,
        status
      });
      
      if (response.data.success) {
        toast.success('Video status updated successfully');
        fetchVideoSubmissions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating video status:', error);
      toast.error('Failed to update video status');
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
            
        
            
            {activeSection === 'orders' && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                  <div className="flex items-center gap-2">
                    {selectedOrders.length > 0 && (
                      <button
                        onClick={deleteSelectedOrders}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete Selected ({selectedOrders.length})
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-black/10 dark:border-white/10 p-6">
                  <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-black text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <Select 
                        value={statusFilter} 
                        onValueChange={(value) => setStatusFilter(value)}
                      >
                        <SelectTrigger className="min-w-[180px] bg-white dark:bg-black">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {ordersLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-6 text-red-500">{ordersError}</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">No orders found</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectAllChecked}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-black focus:ring-black dark:focus:ring-white border-gray-300 dark:border-gray-700 rounded"
                                  />
                                </div>
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order._id)}
                                    onChange={(e) => handleSelectOrder(order._id, e.target.checked)}
                                    className="h-4 w-4 text-black focus:ring-black dark:focus:ring-white border-gray-300 dark:border-gray-700 rounded"
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{order._id.slice(-6)}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">{order.customer.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{order.customer.email}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Select 
                                    value={order.status} 
                                    onValueChange={(value) => updateOrderStatus(order._id, value as Order['status'])}
                                  >
                                    <SelectTrigger className={`w-full max-w-[140px] text-xs py-1 ${statusColors[order.status]}`}>
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-black">
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    L.E {order.totalAmount.toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <AlertDialog>
                                    <AlertDialogTrigger className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-3">
                                      Delete
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white dark:bg-black">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-black dark:text-white">Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                          This action cannot be undone. This will permanently delete this order from the database.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600">Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-red-600 text-white hover:bg-red-700" 
                                          onClick={() => deleteOrder(order._id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Showing {filteredOrders.length} of {orders.length} orders
                      </div>
                    </>
                  )}
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
    if (!stats) return null;
    
    // Calculate goal percentage for the progress bar
    const goalPercentage = monthlyGoal > 0
      ? Math.min(Math.round((stats.currentMonthSales / monthlyGoal) * 100), 100)
      : 0;
      
    return (
      <div className="space-y-8">
        {/* Dashboard Stats Cards - Make more responsive */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                href="/test"
                className="text-sm text-black hover:text-black/70 dark:text-white dark:hover:text-white/70 mt-2 inline-flex items-center"
              >
                View Real Orders
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </CardContentUI>
          </CardUI>

          {/* Sales Card */}
          <CardUI className="bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow border border-black/10 dark:border-white/10">
            <CardHeaderUI className="pb-2">
              <CardTitleUI className="text-sm font-medium text-black dark:text-white">Total Sales</CardTitleUI>
            </CardHeaderUI>
            <CardContentUI className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-black dark:text-white">{stats.totalSales.toLocaleString()}</div>
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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
                  </svg>
                </div>
              </div>
              <div className="text-xs text-black/70 dark:text-white/70 mt-2">
                🔴 LIVE - Updates every 3 seconds
              </div>
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


          
          {/* Status Card */}
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

        {/* Monthly Goal and Monthly Sales Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
          {/* Monthly Goal Card */}
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
                    // Ensure we have a valid stats object before accessing monthlyGoal
                    if (stats && typeof stats.monthlyGoal === 'number') {
                      setMonthlyGoal(stats.monthlyGoal); // Reset to original value
                    } else {
                      setMonthlyGoal(fallbackStats.monthlyGoal); // Use fallback
                    }
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
                    {(() => {
                      // Safe access to currentMonthSales with fallback to 0
                      const currentMonthSales = (stats && typeof stats.currentMonthSales === 'number') 
                        ? stats.currentMonthSales 
                        : 0;
                        
                      // Calculate goal percentage safely
                      const goalPercentage = monthlyGoal > 0
                        ? Math.min(Math.round((currentMonthSales / monthlyGoal) * 100), 100)
                        : 0;
                        
                      // Format numbers safely
                      const formatNumber = (num: number) => {
                        try {
                          return num.toLocaleString();
                        } catch (e) {
                          return '0';
                        }
                      };
                      
                      return (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-black dark:text-white">
                      L.E {formatNumber(currentMonthSales)}
                    </span>
                    <span className="text-sm font-medium text-black dark:text-white">
                      L.E {formatNumber(monthlyGoal)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black dark:bg-white rounded-full" 
                      style={{ width: `${goalPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-black/70 dark:text-white/70">
                    <span>{goalPercentage}% of monthly goal</span>
                    <span>Goal: L.E {formatNumber(monthlyGoal)}</span>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60 mt-1">
                    Auto-refreshes with new orders
                  </div>
                        </>
                      );
                    })()} 
                </>
              )}
            </div>
          </CardContentUI>
        </CardUI>

          {/* Monthly Sales Overview - New Version */}
        <CardUI className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10">
          <CardHeaderUI>
            <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Monthly Sales Overview</CardTitleUI>
              <CardDescription className="text-black/70 dark:text-white/70">Sales performance for all months</CardDescription>
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
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(0,0,0,0.1)" 
                      className="dark:stroke-[rgba(255,255,255,0.1)]" 
                    />
                  <XAxis 
                    dataKey="name" 
                      stroke="currentColor" 
                      tick={{ fill: 'currentColor' }}
                      className="text-black dark:text-white"
                  />
                  <YAxis 
                      stroke="currentColor" 
                      tick={{ fill: 'currentColor' }}
                      domain={[0, monthlyGoal > 0 ? monthlyGoal : 10000]} 
                      className="text-black dark:text-white"
                  />
                  <Tooltip 
                      formatter={(value) => [`L.E ${Number(value).toLocaleString()}`, 'Sales']} 
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      color: 'var(--tooltip-text, #000)',
                        border: '1px solid var(--tooltip-border, #ccc)',
                        borderRadius: '4px',
                        padding: '8px'
                      }}
                      itemStyle={{
                        color: '#000',
                      }}
                      labelStyle={{
                        color: '#000',
                        fontWeight: 'bold'
                      }}
                      wrapperClassName="!bg-white dark:!bg-black dark:!text-white" 
                    />
                    <ReferenceLine 
                      y={monthlyGoal} 
                      label={{ 
                        value: 'Goal', 
                        position: 'right', 
                        fill: 'currentColor',
                        className: 'text-black dark:text-white'
                      }} 
                      stroke="#FF0000" 
                      strokeDasharray="5 5" 
                      className="dark:stroke-red-500"
                  />
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" className="dark:text-white" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#000000" className="dark:text-white" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                      stroke="currentColor"
                    strokeWidth={2}
                      fill="url(#colorSales)" 
                    fillOpacity={1} 
                      className="text-black dark:text-white"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {stats.monthlyData.map((month, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="font-medium text-black dark:text-white">{month.name}</span>
                      <span className="text-black/70 dark:text-white/70">L.E {month.sales.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
            </div>
          </CardContentUI>
        </CardUI>
        </div>

        {/* Recent Orders Table */}
        <DarkModePanel className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
          <CardHeaderUI className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
            <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Recent Orders</CardTitleUI>
            <CardDescription className="text-black/70 dark:text-white/70">Latest orders across your store</CardDescription>
            </div>
            {selectedOrders.length > 0 && (
              <button
                onClick={deleteSelectedOrders}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected ({selectedOrders.length})
              </button>
            )}
          </CardHeaderUI>
          <CardContentUI>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-2 text-left font-medium text-black dark:text-white">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAllChecked}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-black focus:ring-black dark:focus:ring-white border-gray-300 dark:border-gray-700 rounded"
                        />
                      </div>
                    </th>
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
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={(e) => handleSelectOrder(order._id, e.target.checked)}
                            className="h-4 w-4 text-black focus:ring-black dark:focus:ring-white border-gray-300 dark:border-gray-700 rounded"
                          />
                        </td>
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
                          <div className="flex items-center justify-end gap-2">
                                        <a
                href={`/orders/${order._id}`}
                className="text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
              >
                View
              </a>
                            <button
                              onClick={() => deleteOrder(order._id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
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
        </DarkModePanel>

        {/* Add the video submissions section */}
        {renderVideoSubmissionsSection()}
      </div>
    );
  };

  const renderVideoSubmissionsSection = () => {
    if (!videoSubmissions.length) {
      return null;
    }

    return (
      <DarkModePanel className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10 rounded-lg overflow-hidden mt-8">
        <CardHeaderUI>
          <CardTitleUI className="text-lg font-semibold text-black dark:text-white">
            Ambassador Links
          </CardTitleUI>
          <CardDescription className="text-black/70 dark:text-white/70">
            View ambassador content links
          </CardDescription>
        </CardHeaderUI>
        <CardContentUI>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Ambassador</th>
                  <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Link</th>
                  <th className="px-4 py-2 text-left font-medium text-black dark:text-white">Submission Date</th>
                  <th className="px-4 py-2 text-right font-medium text-black dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videoSubmissions.map((submission) => (
                  <tr key={submission._id} className="border-b border-black/10 dark:border-white/10">
                    <td className="px-4 py-2">
                      <div className="font-medium text-black dark:text-white">{submission.name}</div>
                      <div className="text-sm text-black/70 dark:text-white/70">{submission.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={submission.productVideoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {submission.productVideoLink}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-black/70 dark:text-white/70">
                      {new Date(submission.videoSubmissionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => {
                          window.open(submission.productVideoLink, '_blank');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContentUI>
      </DarkModePanel>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 p-3 md:p-6 lg:p-8 pb-20 lg:pb-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Modern dashboard heading with Montserrat font */}
          <div className="mb-8">
            <h1 
              className="font-montserrat text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
             Dashboard
            </h1>
            <div className="h-1 w-24 sm:w-32 md:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          {/* Content based on active section */}
          {activeSection === 'dashboard' && renderDashboardContent()}
          
          {/* Monthly Goal and Monthly Sales Overview Cards - make more responsive */}
          {activeSection !== 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
              {/* Monthly Goal Card */}
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
                        {(() => {
                          const goalPercentage = monthlyGoal > 0
                            ? Math.min(Math.round((stats?.currentMonthSales || 0) / monthlyGoal * 100), 100)
                            : 0;
                          return (
                            <>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-black dark:text-white">L.E {stats?.currentMonthSales.toLocaleString()}</span>
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
                          );
                        })()}
                      </>
                    )}
                  </div>
                </CardContentUI>
              </CardUI>

              {/* Monthly Sales Overview - New Version */}
              <CardUI className="bg-white dark:bg-black shadow-sm border border-black/10 dark:border-white/10">
                <CardHeaderUI>
                  <CardTitleUI className="text-lg font-semibold text-black dark:text-white">Monthly Sales Overview</CardTitleUI>
                  <CardDescription className="text-black/70 dark:text-white/70">Sales performance for all months</CardDescription>
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
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(0,0,0,0.1)" 
                          className="dark:stroke-[rgba(255,255,255,0.1)]" 
                        />
                        <XAxis 
                          dataKey="name" 
                          stroke="currentColor" 
                          tick={{ fill: 'currentColor' }}
                          className="text-black dark:text-white"
                        />
                        <YAxis 
                          stroke="currentColor" 
                          tick={{ fill: 'currentColor' }}
                          domain={[0, monthlyGoal > 0 ? monthlyGoal : 10000]} 
                          className="text-black dark:text-white"
                        />
                        <Tooltip 
                          formatter={(value) => [`L.E ${Number(value).toLocaleString()}`, 'Sales']} 
                          contentStyle={{
                            backgroundColor: 'var(--tooltip-bg, #fff)',
                            color: 'var(--tooltip-text, #000)',
                            border: '1px solid var(--tooltip-border, #ccc)',
                            borderRadius: '4px',
                            padding: '8px'
                          }}
                          itemStyle={{
                            color: '#000',
                          }}
                          labelStyle={{
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                          wrapperClassName="!bg-white dark:!bg-black dark:!text-white" 
                        />
                        <ReferenceLine 
                          y={monthlyGoal} 
                          label={{ 
                            value: 'Goal', 
                            position: 'right', 
                            fill: 'currentColor',
                            className: 'text-black dark:text-white'
                          }} 
                          stroke="#FF0000" 
                          strokeDasharray="5 5" 
                          className="dark:stroke-red-500"
                        />
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000000" className="dark:text-white" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#000000" className="dark:text-white" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="currentColor"
                          strokeWidth={2}
                          fill="url(#colorSales)" 
                          fillOpacity={1} 
                          className="text-black dark:text-white"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                      </div>
                  <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {stats.monthlyData.map((month, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <span className="font-medium text-black dark:text-white">{month.name}</span>
                          <span className="text-black/70 dark:text-white/70">L.E {month.sales.toLocaleString()}</span>
                  </div>
                      ))}
                  </div>
                </div>
                </CardContentUI>
              </CardUI>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
