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
    try {
      // Fetch actual orders from the real e-commerce system
      const response = await axios.get('/api/orders', {
        withCredentials: true,
        // Add timeout to prevent hanging requests
        timeout: 10000,
        // Add error handling headers
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Raw orders data for analytics:', response.data);
      
      // Check if response data is valid
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from API');
      }
      
      // Process the orders data to generate sales analytics
      const processedData = processOrdersForAnalytics(response.data, timeframe);
      setSalesData(processedData);
      setError('');
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data. Please try again later.');
      toast.error('Failed to load sales data. Check your network connection and try again.');
      // Set empty sales data instead of leaving it undefined
      setSalesData([]);
    } finally {
      setIsLoading(false);
    }
  };
  

  
  // Process orders data into analytics format based on selected timeframe
  const processOrdersForAnalytics = (orders: any[], selectedTimeframe: string): SalesData[] => {
    if (!orders || orders.length === 0) {
      return [];
    }
    
    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.orderDate || a.createdAt);
      const dateB = new Date(b.orderDate || b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Group by timeframe
    const groupedData: Record<string, {amount: number, count: number}> = {};
    
    sortedOrders.forEach(order => {
      const orderDate = new Date(order.orderDate || order.createdAt);
      const orderAmount = Number(order.totalAmount || order.total || 0);
      
      if (isNaN(orderAmount)) {
        console.warn('Invalid order amount:', order);
        return;
      }
      
      let timeKey = '';
      
      if (selectedTimeframe === 'weekly') {
        // Get week number and year
        const weekStart = new Date(orderDate);
        const dayOfWeek = orderDate.getDay();
        const diff = orderDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        weekStart.setDate(diff);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        timeKey = `Week of ${weekStartStr}`;
      } else if (selectedTimeframe === 'monthly') {
        // Format: 'Jan 2025'
        timeKey = orderDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      } else if (selectedTimeframe === 'yearly') {
        // Format: '2025'
        timeKey = orderDate.getFullYear().toString();
      } else {
        // Default to daily
        timeKey = orderDate.toISOString().split('T')[0];
      }
      
      if (!groupedData[timeKey]) {
        groupedData[timeKey] = { amount: 0, count: 0 };
      }
      
      groupedData[timeKey].amount += orderAmount;
      groupedData[timeKey].count += 1;
    });
    
    // Convert to array format
    const result: SalesData[] = Object.keys(groupedData).map(date => ({
      date,
      amount: parseFloat(groupedData[date].amount.toFixed(2)),
      count: groupedData[date].count
    }));
    
    return result;
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
  
  const exportToExcel = () => {
    try {
      // Create workbook with sales data
      if (!salesData.length) {
        toast.error('No data available to export');
        return;
      }
      
      // Use XLSX library to create Excel file
      const wb = XLSX ? XLSX.utils.book_new() : null;
      if (!wb) {
        // Fallback if XLSX is not available
        const csvContent = 
          'Date,Orders,Sales Amount,Average Order\n' +
          salesData.map(item => {
            return `"${item.date}",${item.count},${item.amount.toFixed(2)},${(item.amount/Math.max(1, item.count)).toFixed(2)}`;
          }).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Sales data exported as CSV');
        return;
      }
      
      // Create worksheet
      const wsData = [
        ['Date', 'Orders', 'Sales Amount (L.E)', 'Average Order Value (L.E)'],
        ...salesData.map(item => [
          item.date,
          item.count,
          item.amount,
          parseFloat((item.amount / Math.max(1, item.count)).toFixed(2))
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Analytics');
      
      // Generate file and trigger download
      XLSX.writeFile(wb, `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Sales data exported successfully');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      toast.error('Failed to export sales data');
    }
  };
  
  const exportToJSON = () => {
    try {
      // Create a JSON blob and download it
      const dataStr = JSON.stringify(salesData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Sales data exported to JSON successfully');
    } catch (err) {
      console.error('Error exporting to JSON:', err);
      toast.error('Failed to export sales data');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen dark:bg-black">
        <Nav />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 dark:border-green-400"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen dark:bg-black">
        <Nav />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales Analytics</h1>
            </div>
          </div>
                    <section className="p-6 bg-white dark:bg-black shadow rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
            

            
            {/* Timeframe selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Timeframe:</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setTimeframe('daily')} 
                  className={`px-4 py-2 rounded ${timeframe === 'daily' ? 'bg-black text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setTimeframe('weekly')} 
                  className={`px-4 py-2 rounded ${timeframe === 'weekly' ? 'bg-black text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setTimeframe('monthly')} 
                  className={`px-4 py-2 rounded ${timeframe === 'monthly' ? 'bg-black text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setTimeframe('yearly')} 
                  className={`px-4 py-2 rounded ${timeframe === 'yearly' ? 'bg-black text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Yearly
                </button>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={exportToExcel}
                  className="group relative overflow-hidden px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 ease-out whitespace-nowrap flex items-center justify-center"
                >
                  <span className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export to Excel
                  </span>
                </button>
                <button
                  onClick={exportToJSON}
                  className="group relative overflow-hidden px-6 py-2.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 ease-out whitespace-nowrap flex items-center justify-center"
                >
                  <span className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export to JSON
                  </span>
                </button>
              </div>
            </div>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DarkModePanel className="rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Sales</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                L.E {salesData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
              </p>
            </DarkModePanel>
            
            <DarkModePanel className="rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {salesData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </p>
            </DarkModePanel>
            
            <DarkModePanel className="rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Average Order Value</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                L.E {(salesData.reduce((sum, item) => sum + item.amount, 0) / 
                      Math.max(1, salesData.reduce((sum, item) => sum + item.count, 0))).toFixed(2)}
              </p>
            </DarkModePanel>
          </div>
          
          <DarkModePanel className="rounded-lg shadow-sm p-6 mb-8">
            <div className="h-[400px] w-full">
              {salesData.length > 0 ? (
                <Chart type="bar" data={prepareChartData()} options={chartOptions} />
              ) : (
                <div className="flex h-full justify-center items-center text-gray-500 dark:text-gray-400">
                  No sales data available for the selected timeframe
                </div>
              )}
            </div>
          </DarkModePanel>
          
          <DarkModePanel className="rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sales Amount</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salesData.length > 0 ? (
                    salesData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">L.E {item.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          L.E {(item.amount / Math.max(1, item.count)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No data available for the selected timeframe
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DarkModePanel>
        </div>
      </main>
    </div>
  );
}
