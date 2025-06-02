'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Nav from '../sections/nav';
import { config } from '../../config';
import { DarkModePanel, DarkModeInput } from '../components/ui/dark-mode-wrapper';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SalesData {
  date: string;
  amount: number;
  count: number;
}

export default function SalesAnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('weekly');
  
  useEffect(() => {
    fetchSalesData();
  }, [timeframe]);
  
  const fetchSalesData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/orders/analytics', {
        params: { 
          timeframe,
          includeStatus: ['completed', 'processing', 'pending']
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 30000
      });
      
      if (!response.data) {
        throw new Error('No data received from API');
      }

      const processedData = processOrdersForAnalytics(response.data.orders || []);
      setSalesData(processedData);
    } catch (err: any) {
      console.error('Error fetching sales data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load sales data';
      setError(errorMessage);
      toast.error(errorMessage);
      setSalesData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processOrdersForAnalytics = (orders: any[]): SalesData[] => {
    if (!orders || orders.length === 0) return [];
    
    const groupedData: Record<string, { amount: number; count: number }> = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;

      const date = new Date(order.createdAt || order.orderDate);
      const amount = Number(order.totalAmount || order.total || 0);
      
      if (isNaN(amount) || !date) return;

      let timeKey = '';
      switch (timeframe) {
        case 'weekly':
          const weekStart = new Date(date);
          const dayOfWeek = date.getDay();
          const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          weekStart.setDate(diff);
          timeKey = `Week of ${weekStart.toISOString().split('T')[0]}`;
          break;
        case 'monthly':
          timeKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'yearly':
          timeKey = date.getFullYear().toString();
          break;
        default:
          timeKey = date.toISOString().split('T')[0];
      }
      
      if (!groupedData[timeKey]) {
        groupedData[timeKey] = { amount: 0, count: 0 };
      }
      
      groupedData[timeKey].amount += amount;
      groupedData[timeKey].count += 1;
    });
    
    return Object.entries(groupedData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        amount: Number(data.amount.toFixed(2)),
        count: data.count
      }));
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    const labels = salesData.map(item => item.date);
    const amounts = salesData.map(item => item.amount);
    const counts = salesData.map(item => item.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Sales Amount (L.E)',
          data: amounts,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Orders Count',
          data: counts,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          yAxisID: 'countAxis',
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Sales Amount (L.E)',
          color: 'rgb(75, 192, 192)',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
      },
      countAxis: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Orders Count',
          color: 'rgb(153, 102, 255)',
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Sales Analytics`,
      },
    },
  };
  
  const exportData = async (format: 'txt' | 'json') => {
    try {
      if (!salesData.length) {
        toast.error('No data available to export');
        return;
      }

      let content: string;
      let filename: string;
      let type: string;

      if (format === 'txt') {
        content = salesData.map(item => 
          `Date: ${item.date}\nOrders: ${item.count}\nSales Amount: L.E ${item.amount}\nAverage Order: L.E ${(item.amount/item.count).toFixed(2)}\n-------------------`
        ).join('\n');
        filename = `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.txt`;
        type = 'text/plain';
      } else {
        content = JSON.stringify(salesData, null, 2);
        filename = `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
        type = 'application/json';
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Sales data exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(`Error exporting to ${format}:`, err);
      toast.error('Failed to export sales data');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen dark:bg-black">
        <Nav />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">Sales Analytics</h1>
            <div className="flex gap-2">
              <button
                onClick={() => exportData('txt')}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-opacity-90"
              >
                Export as TXT
              </button>
              <button
                onClick={() => exportData('json')}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-opacity-90"
              >
                Export as JSON
              </button>
            </div>
          </div>

          {error ? (
            <div className="text-red-600 dark:text-red-400 p-4 rounded bg-red-100 dark:bg-red-900/20">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DarkModePanel className="p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Total Sales</h3>
                  <p className="text-3xl font-bold">
                    L.E {salesData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </p>
                </DarkModePanel>
                
                <DarkModePanel className="p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold">
                    {salesData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                  </p>
                </DarkModePanel>
                
                <DarkModePanel className="p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Average Order Value</h3>
                  <p className="text-3xl font-bold">
                    L.E {(salesData.reduce((sum, item) => sum + item.amount, 0) / 
                         Math.max(1, salesData.reduce((sum, item) => sum + item.count, 0))).toFixed(2)}
                  </p>
                </DarkModePanel>
              </div>
              
              <DarkModePanel className="rounded-lg overflow-hidden">
                <div className="p-4 border-b dark:border-white/10">
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
                      <button
                        key={period}
                        onClick={() => setTimeframe(period)}
                        className={`px-4 py-2 rounded capitalize ${
                          timeframe === period
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Sales Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Average Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {salesData.length > 0 ? (
                        salesData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap">L.E {item.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              L.E {(item.amount / Math.max(1, item.count)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center">
                            No sales data available for the selected timeframe
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DarkModePanel>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
