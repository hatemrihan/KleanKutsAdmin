'use client';

import { useState, useEffect } from 'react';
import Nav from "../sections/nav";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { config } from '../../config';

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{order._id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.customerName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.total?.toLocaleString() || '0'} L.E</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}