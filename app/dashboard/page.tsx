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
}

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

  useEffect(() => {
    fetchDashboardStats();
  }, []);
  
  // Fetch orders when orders tab is selected
  useEffect(() => {
    if (activeSection === 'orders') {
      fetchOrders();
    }
  }, [activeSection]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${config.apiUrl}/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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
            <div className="text-center text-red-500">Failed to load dashboard data</div>
          </div>
        </main>
      </div>
    );
  }

  const renderDashboardContent = () => {
    const progressPercentage = (stats.currentMonthSales / stats.monthlyGoal) * 100;

    // Prepare data for the chart
    const chartData = [
      { name: 'Jan', sales: 0 },
      { name: 'Feb', sales: 0 },
      { name: 'Mar', sales: 0 },
      { name: 'Apr', sales: 0 },
      { name: 'May', sales: 0 },
      { name: 'Jun', sales: 0 },
      { name: 'Jul', sales: 0 },
      { name: 'Aug', sales: 0 },
      { name: 'Sep', sales: 0 },
      { name: 'Oct', sales: 0 },
      { name: 'Nov', sales: 0 },
      { name: 'Dec', sales: 0 },
    ];

    // Update current month's sales in the chart data
    const currentMonth = new Date().getMonth();
    chartData[currentMonth].sales = stats.currentMonthSales;

    return (
      <>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-green-500">All time orders</p>
            </CardContent>
          </Card>
            
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales?.toLocaleString() || '0'} L.E</div>
              <p className="text-xs text-green-500">All time revenue</p>
            </CardContent>
          </Card>
            
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              <p className="text-xs text-blue-500">Currently available</p>
            </CardContent>
          </Card>
            
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-gray-500">Product categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Goal Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Sales Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold">{stats.currentMonthSales?.toLocaleString() || '0'} L.E</div>
                  <p className="text-sm text-gray-500">Current month sales</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stats.monthlyGoal?.toLocaleString() || '0'} L.E</div>
                  <p className="text-sm text-gray-500">Monthly goal</p>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-gray-500 text-right">
                {progressPercentage.toFixed(1)}% of goal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} L.E`, 'Sales']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{order.customerName}</p>
                    <p className="text-sm text-gray-500">#{order._id.substring(0, 8)}</p>
                  </div>
                  <div className="ml-auto font-medium">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.customer.name}</div>
                              <div className="text-sm text-gray-500">{order.customer.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              L.E {order.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
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
                    <p>Visit the Dashboard page for more options once we fix the routing issue.</p>
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