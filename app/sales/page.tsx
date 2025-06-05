'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Nav from '../sections/nav';
import { config } from '../../config';
import { DarkModePanel, DarkModeInput } from '../components/ui/dark-mode-wrapper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SalesData {
  date: string;
  amount: number;
  count: number;
}

interface SalesSummary {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
}

interface AnalyticsResponse {
  salesData: SalesData[];
  summary: SalesSummary;
}

export default function SalesAnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<SalesSummary>({
    totalOrders: 0,
    totalSales: 0,
    averageOrderValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('weekly');
  const [showAll, setShowAll] = useState(true); // Default to showing all orders
  
  useEffect(() => {
    fetchSalesData();
  }, [timeframe, showAll]);
  
  const fetchSalesData = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log(`Fetching sales data with timeframe: ${timeframe}, showAll: ${showAll}`);
      
      const response = await axios.get(`/api/orders/analytics`, {
        params: {
          timeframe,
          showAll: showAll.toString()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Analytics API response:', response.data);

      if (!response.data) {
        throw new Error('No data received');
      }

      // Handle both old and new response format
      if (response.data.salesData && response.data.summary) {
        setSalesData(response.data.salesData);
        setSummary(response.data.summary);
      } else if (Array.isArray(response.data)) {
        // Old format - calculate summary manually
        setSalesData(response.data);
        const totalAmount = response.data.reduce((sum: number, item: SalesData) => sum + item.amount, 0);
        const totalCount = response.data.reduce((sum: number, item: SalesData) => sum + item.count, 0);
        setSummary({
          totalOrders: totalCount,
          totalSales: totalAmount,
          averageOrderValue: totalCount > 0 ? totalAmount / totalCount : 0
        });
      }
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      
      let errorMessage = 'Failed to load sales data.';
      if (err.response?.status === 404) {
        errorMessage = 'Sales data not found. Please check the API endpoint.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      setSalesData([]);
      setSummary({ totalOrders: 0, totalSales: 0, averageOrderValue: 0 });
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportToExcel = () => {
    try {
      // Create workbook with sales data
      if (!salesData.length) {
        toast.error('No data available to export');
        return;
      }
      
      // Use XLSX library to create Excel file
      const wb = XLSX.utils.book_new();
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
  
  const exportToTxt = () => {
    try {
      if (!salesData.length) {
        toast.error('No data available to export');
        return;
      }

      // Create text content
      const txtContent = 
        'Sales Analytics Report\n' +
        '====================\n\n' +
        `Timeframe: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}\n` +
        `Generated on: ${new Date().toLocaleString()}\n\n` +
        'Date\tOrders\tSales Amount (L.E)\tAverage Order (L.E)\n' +
        '------------------------------------------------\n' +
        salesData.map(item => {
          const avgOrder = (item.amount / Math.max(1, item.count)).toFixed(2);
          return `${item.date}\t${item.count}\t${item.amount.toLocaleString()}\t${avgOrder}`;
        }).join('\n') +
        '\n\n' +
        'Summary\n' +
        '-------\n' +
        `Total Sales: L.E ${salesData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}\n` +
        `Total Orders: ${salesData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}\n` +
        `Average Order Value: L.E ${(salesData.reduce((sum, item) => sum + item.amount, 0) / 
          Math.max(1, salesData.reduce((sum, item) => sum + item.count, 0))).toFixed(2)}`;

      // Create and download the file
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Sales data exported successfully');
    } catch (err) {
      console.error('Error exporting to text:', err);
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
      <main className="flex-1 p-3 lg:p-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sales Analytics</h1>
            </div>
          </div>
          
          <section className="p-4 bg-white dark:bg-black shadow rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-3">Sales Analytics</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Select Timeframe:
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Data Range:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dataRange"
                      checked={showAll}
                      onChange={() => setShowAll(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">All Orders</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="dataRange"
                      checked={!showAll}
                      onChange={() => setShowAll(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Recent Period</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={exportToExcel}
                className="group relative px-4 py-1.5 rounded-full bg-black text-white text-sm font-medium shadow hover:shadow-md transition-all duration-300 ease-out whitespace-nowrap flex items-center justify-center"
              >
                <span className="relative flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export to Excel
                </span>
              </button>
              <button
                onClick={exportToTxt}
                className="group relative px-4 py-1.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 text-white text-sm font-medium shadow hover:shadow-md transition-all duration-300 ease-out whitespace-nowrap flex items-center justify-center"
              >
                <span className="relative flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export to TXT
                </span>
              </button>
            </div>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <DarkModePanel className="rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Total Sales</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                L.E {summary.totalSales.toLocaleString()}
              </p>
              {showAll && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All time total
                </p>
              )}
            </DarkModePanel>
            
            <DarkModePanel className="rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.totalOrders.toLocaleString()}
              </p>
              {showAll && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All orders from database
                </p>
              )}
            </DarkModePanel>
            
            <DarkModePanel className="rounded-lg shadow-sm p-4">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Average Order Value</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                L.E {summary.averageOrderValue.toFixed(2)}
              </p>
            </DarkModePanel>
          </div>
          
          <DarkModePanel className="rounded-lg shadow-sm p-4 mb-4">
            <div className="h-[350px] w-full">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs text-gray-600 dark:text-gray-400"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      yAxisId="left"
                      className="text-xs text-gray-600 dark:text-gray-400"
                      label={{ value: 'Sales Amount (L.E)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      className="text-xs text-gray-600 dark:text-gray-400"
                      label={{ value: 'Orders Count', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name="Sales Amount (L.E)" 
                      fill="#4ade80"
                      yAxisId="left"
                    />
                    <Bar 
                      dataKey="count" 
                      name="Orders Count" 
                      fill="#818cf8"
                      yAxisId="right"
                    />
                  </BarChart>
                </ResponsiveContainer>
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
                    <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sales Amount</th>
                    <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salesData.length > 0 ? (
                    salesData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.date}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.count}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">L.E {item.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          L.E {(item.amount / Math.max(1, item.count)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
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
