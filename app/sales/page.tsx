'use client';

import React, { useState, useEffect } from 'react';
import Nav from '../sections/nav';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';

// Define date filter options
const DATE_FILTERS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  ALL_TIME: 'all_time',
  CUSTOM: 'custom'
};

// Define types for better TypeScript support
interface Order {
  _id: string;
  customer?: {
    name?: string;
  };
  createdAt: string | Date;
  totalAmount: number;
  status?: string;
  products?: Array<{
    name?: string;
    price?: number;
    quantity?: number;
  }>;
}

interface DailySales {
  date: string;
  formattedDate: string;
  sales: number;
  orders: number;
}

interface ProductSales {
  name: string;
  sales: number;
  quantity: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface SalesData {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  dailySales: DailySales[];
  productSales: ProductSales[];
  statusDistribution: StatusDistribution[];
}

export default function SalesAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [refreshInterval, setRefreshInterval] = useState(5); // Minutes
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Analytics data
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    dailySales: [],
    productSales: [],
    statusDistribution: []
  });

  useEffect(() => {
    fetchOrders();
    
    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOrders();
      }, refreshInterval * 60000); // Convert minutes to milliseconds
      
      return () => clearInterval(interval);
    }
  }, [dateFilter, customDateRange, autoRefresh, refreshInterval]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders');
      
      if (response.data) {
        const filteredOrders = filterOrdersByDate(response.data);
        setOrders(filteredOrders);
        analyzeOrders(filteredOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByDate = (allOrders: Order[]): Order[] => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (dateFilter) {
      case DATE_FILTERS.TODAY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case DATE_FILTERS.YESTERDAY:
        startDate = new Date(subDays(now, 1).setHours(0, 0, 0, 0));
        endDate = new Date(subDays(now, 1).setHours(23, 59, 59, 999));
        break;
      case DATE_FILTERS.THIS_WEEK:
        startDate = startOfWeek(now);
        endDate = now;
        break;
      case DATE_FILTERS.LAST_WEEK:
        startDate = startOfWeek(subDays(now, 7));
        endDate = endOfWeek(subDays(now, 7));
        break;
      case DATE_FILTERS.THIS_MONTH:
        startDate = startOfMonth(now);
        endDate = now;
        break;
      case DATE_FILTERS.LAST_MONTH:
        startDate = startOfMonth(subDays(now, 30));
        endDate = endOfMonth(subDays(now, 30));
        break;
      case DATE_FILTERS.CUSTOM:
        startDate = new Date(`${customDateRange.startDate}T00:00:00`);
        endDate = new Date(`${customDateRange.endDate}T23:59:59`);
        break;
      case DATE_FILTERS.ALL_TIME:
      default:
        return allOrders;
    }

    return allOrders.filter(order => {
      // First, ensure order.createdAt is valid
      const orderDate = order.createdAt ? 
        (typeof order.createdAt === 'string' ? parseISO(order.createdAt) : new Date(order.createdAt)) 
        : null;
      
      if (!orderDate || !isValid(orderDate)) return false;
      
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const analyzeOrders = (filteredOrders: Order[]) => {
    // Calculate total sales
    const totalSales = filteredOrders.reduce((sum: number, order) => 
      sum + (Number(order.totalAmount) || 0), 0);
    
    // Order count
    const orderCount = filteredOrders.length;
    
    // Average order value
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Group orders by day for daily sales chart
    const dailySalesMap: Record<string, DailySales> = {};
    filteredOrders.forEach(order => {
      const orderDate = order.createdAt ? 
        (typeof order.createdAt === 'string' ? parseISO(order.createdAt) : new Date(order.createdAt)) 
        : new Date();
      
      const dateString = format(orderDate, 'yyyy-MM-dd');
      if (!dailySalesMap[dateString]) {
        dailySalesMap[dateString] = {
          date: dateString,
          formattedDate: format(orderDate, 'MMM dd'),
          sales: 0,
          orders: 0
        };
      }
      
      dailySalesMap[dateString].sales += (Number(order.totalAmount) || 0);
      dailySalesMap[dateString].orders += 1;
    });
    
    const dailySales = Object.values(dailySalesMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by product for product sales chart
    const productSalesMap: Record<string, ProductSales> = {};
    filteredOrders.forEach(order => {
      if (Array.isArray(order.products)) {
        order.products.forEach(product => {
          const productName = product.name || 'Unknown Product';
          if (!productSalesMap[productName]) {
            productSalesMap[productName] = {
              name: productName,
              sales: 0,
              quantity: 0
            };
          }
          
          productSalesMap[productName].sales += 
            (Number(product.price) * Number(product.quantity)) || 0;
          productSalesMap[productName].quantity += Number(product.quantity) || 0;
        });
      }
    });
    
    const productSales = Object.values(productSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 products
    
    // Order status distribution
    const statusMap: Record<string, StatusDistribution> = {};
    filteredOrders.forEach(order => {
      const status = order.status || 'unknown';
      if (!statusMap[status]) {
        statusMap[status] = {
          status,
          count: 0
        };
      }
      statusMap[status].count += 1;
    });
    
    const statusDistribution = Object.values(statusMap);
    
    setSalesData({
      totalSales,
      orderCount,
      averageOrderValue,
      dailySales,
      productSales,
      statusDistribution
    });
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value: number | string) => {
    return `L.E ${Number(value).toLocaleString()}`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const renderDateFilterControls = () => {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={handleDateFilterChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={DATE_FILTERS.TODAY}>Today</option>
              <option value={DATE_FILTERS.YESTERDAY}>Yesterday</option>
              <option value={DATE_FILTERS.THIS_WEEK}>This Week</option>
              <option value={DATE_FILTERS.LAST_WEEK}>Last Week</option>
              <option value={DATE_FILTERS.THIS_MONTH}>This Month</option>
              <option value={DATE_FILTERS.LAST_MONTH}>Last Month</option>
              <option value={DATE_FILTERS.ALL_TIME}>All Time</option>
              <option value={DATE_FILTERS.CUSTOM}>Custom Range</option>
            </select>
          </div>
          
          {dateFilter === DATE_FILTERS.CUSTOM && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={customDateRange.startDate}
                  onChange={handleCustomDateChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={customDateRange.endDate}
                  onChange={handleCustomDateChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center mt-4 sm:mt-0">
            <label htmlFor="autoRefresh" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
            </label>
            
            {autoRefresh && (
              <div className="ml-4">
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="block px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>Every 1 minute</option>
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                </select>
              </div>
            )}
            
            <button
              onClick={fetchOrders}
              className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Sales Analytics</h1>
          
          {renderDateFilterControls()}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                  <p className="text-3xl font-bold">{formatCurrency(salesData.totalSales)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    For {dateFilter === DATE_FILTERS.ALL_TIME ? 'all time' : 'selected period'}
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <p className="text-3xl font-bold">{salesData.orderCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    For {dateFilter === DATE_FILTERS.ALL_TIME ? 'all time' : 'selected period'}
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
                  <p className="text-3xl font-bold">{formatCurrency(salesData.averageOrderValue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    For {dateFilter === DATE_FILTERS.ALL_TIME ? 'all time' : 'selected period'}
                  </p>
                </div>
              </div>
              
              {/* Daily Sales Chart */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-medium mb-4">Daily Sales</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesData.dailySales}
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDate" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(Array.isArray(value) ? value[0] : value)} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        name="Sales" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Products */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">Top Products by Sales</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesData.productSales}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90}
                          tick={{ fontSize: 12 }}
                        />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip formatter={(value: any) => formatCurrency(Array.isArray(value) ? value[0] : value)} />
                        <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Order Status Distribution */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h2 className="text-lg font-medium mb-4">Order Status Distribution</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => Array.isArray(value) ? value[0] : value} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Recent Orders */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice(0, 10).map((order) => {
                        const orderDate = order.createdAt ? 
                          (typeof order.createdAt === 'string' ? parseISO(order.createdAt) : new Date(order.createdAt)) 
                          : new Date();
                          
                        return (
                          <tr key={order._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {order._id.substring(order._id.length - 8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customer?.name || 'Unknown Customer'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(orderDate, 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status ? `${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` : 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No orders found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 