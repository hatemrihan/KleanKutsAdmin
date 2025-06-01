'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Nav from '../sections/nav';
import { Input } from '../components/ui/input';
import { config } from '../../config';
import * as XLSX from 'xlsx';
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
import { DarkModePanel, DarkModeInput, DarkModeStatus } from '../components/ui/dark-mode-wrapper';
import PaymentScreenshotViewer from '../components/PaymentScreenshotViewer';

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
  size?: string;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Order {
  _id: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  totalAmount: number;
  total?: number;
  createdAt: string;
  orderDate?: string;
  products: OrderProduct[];
  couponCode?: string;
  couponDiscount?: number;
  ambassadorId?: string;
  promoCode?: {
    code: string;
    value: number;
    type: string;
  };
  ambassador?: {
    ambassadorId: string;
    couponCode: string;
  };
  paymentMethod?: 'cod' | 'instapay';
  transactionScreenshot?: string;
  paymentVerified?: boolean;
  notes?: string;
}

interface ApiErrorResponse {
  error: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const getCouponDisplay = (order: Order) => {
  // Extract coupon information from all possible sources
  const couponCode = order.couponCode || 
                     (order.promoCode && order.promoCode.code) || 
                     (order.ambassador && order.ambassador.couponCode);
  
  const couponDiscount = order.couponDiscount || 
                         (order.promoCode && order.promoCode.value) || 
                         0;
  
  const ambassadorId = order.ambassadorId || 
                       (order.ambassador && order.ambassador.ambassadorId) || 
                       undefined; // Remove the ambassadorId reference from promoCode

  console.log('DEBUG getCouponDisplay input:', {
    orderId: order._id,
    extractedCode: couponCode,
    extractedDiscount: couponDiscount,
    extractedAmbassadorId: ambassadorId,
    originalData: {
      couponCode: order.couponCode,
      couponDiscount: order.couponDiscount,
      ambassadorId: order.ambassadorId,
      promoCode: order.promoCode,
      ambassador: order.ambassador
    }
  });

  if (!couponCode) {
    console.log('DEBUG: No coupon code found for order:', order._id);
    return null;
  }
  
  const display = {
    code: couponCode,
    discount: couponDiscount,
    isAmbassador: !!ambassadorId
  };

  console.log('DEBUG getCouponDisplay output:', display);
  return display;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get('/api/orders');
      console.log('Raw orders data:', response.data);
      
      // Enhanced debug logging for orders
      response.data.forEach((order: any) => {
        console.log('DEBUG Raw order:', {
          id: order._id,
          couponCode: order.couponCode,
          couponDiscount: order.couponDiscount,
          ambassadorId: order.ambassadorId,
          promoCode: order.promoCode,
          ambassador: order.ambassador
        });
      });
      
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

        // Normalize coupon information
        const normalizedCouponInfo = {
          couponCode: order.couponCode || order.promoCode?.code || null,
          couponDiscount: order.couponDiscount || order.promoCode?.value || null,
          ambassadorId: order.ambassadorId || order.ambassador?.ambassadorId || null,
          promoCode: order.promoCode || null,
          ambassador: order.ambassador || null
        };

        console.log('DEBUG Normalized coupon info:', {
          orderId: order._id,
          ...normalizedCouponInfo
        });

        // Handle old order format (with firstName/lastName)
        if (!order.customer && (order.firstName || order.lastName)) {
          const transformedOrder = {
            ...order,
            customer: {
              name: `${order.firstName || ''} ${order.lastName || ''}`.trim() || defaultCustomer.name,
              email: order.email || defaultCustomer.email,
              phone: order.phone || defaultCustomer.phone,
              address: order.address || defaultCustomer.address
            },
            totalAmount: Number(order.total || order.totalAmount) || 0,
            paymentMethod: order.paymentMethod || 'cod',
            transactionScreenshot: order.transactionScreenshot || null,
            // Use normalized coupon information
            ...normalizedCouponInfo,
            products: Array.isArray(order.products) ? order.products.map((product: any) => ({
              productId: product.id || product.productId || '',
              name: product.name || 'Unknown Product',
              price: Number(product.price) || 0,
              quantity: Number(product.quantity) || 1,
              size: product.size || 'N/A',
              image: product.image || ''
            })) : []
          };
          console.log('DEBUG Transformed order:', transformedOrder);
          return transformedOrder;
        }

        // Ensure customer object exists and has all required fields
        const customer = order.customer || defaultCustomer;
        const transformedOrder = {
          ...order,
          customer: {
            name: customer.name || defaultCustomer.name,
            email: customer.email || defaultCustomer.email,
            phone: customer.phone || defaultCustomer.phone,
            address: customer.address || defaultCustomer.address
          },
          products: Array.isArray(order.products) ? order.products.map((product: any) => ({
            productId: product.productId || product.id || '',
            name: product.name || 'Unknown Product',
            price: Number(product.price) || 0,
            quantity: Number(product.quantity) || 1,
            size: product.size || 'N/A',
            image: product.image || ''
          })) : [],
          totalAmount: Number(order.totalAmount || order.total) || 0,
          paymentMethod: order.paymentMethod || 'cod',
          transactionScreenshot: order.transactionScreenshot || null,
          // Use normalized coupon information
          ...normalizedCouponInfo
        };

        console.log('DEBUG Transformed order:', transformedOrder);
        return transformedOrder;
      }).filter(Boolean);
      
      console.log('Final validated orders:', validatedOrders);
      setOrders(validatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.error || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await axios.put(`/api/orders`, {
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
      await axios.delete(`/api/orders?id=${orderId}`);
      setOrders(orders.filter(order => order._id !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };
  
  // Export orders to Excel
  const exportOrdersToExcel = () => {
    try {
      // Prepare data for export
      const exportData = orders.map(order => {
        // Calculate total without discounts/promos
        const productTotal = order.products.reduce((sum, product) => {
          return sum + (product.price * product.quantity);
        }, 0);
        
        // Get delivery cost (assuming it's the difference between totalAmount and product prices)
        // If there's a coupon, we need to add back the discount to get the original total
        const couponDiscount = order.couponDiscount || 0;
        const originalTotal = order.totalAmount + (productTotal * (couponDiscount / 100) || 0);
        const deliveryCost = Math.max(0, originalTotal - productTotal);
        
        // Calculate the total we want to show (product cost + delivery, no discounts)
        const exportTotal = productTotal + deliveryCost;
        
        // Prepare customer info
        const customerName = (order.customer?.name ?? `${order.firstName ?? ""} ${order.lastName ?? ""}`.trim()) || "Unknown";
        const customerEmail = order.customer?.email ?? order.email ?? "N/A";
        const customerPhone = order.customer?.phone ?? order.phone ?? "N/A";
        const customerAddress = order.customer?.address ?? order.address ?? "N/A";
        
        // Format date
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 
                         order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A";
        
        // Prepare products as a string
        const productsText = order.products.map(p => 
          `${p.name} (${p.size}) x${p.quantity} - $${p.price.toFixed(2)}`
        ).join("\n");
        
        return {
          "Order ID": order._id,
          "Order Date": orderDate,
          "Customer Name": customerName,
          "Email": customerEmail,
          "Phone": customerPhone,
          "Address": customerAddress,
          "Payment Method": order.paymentMethod || "N/A",
          "Status": order.status,
          "Products": productsText,
          "Product Cost": productTotal.toFixed(2),
          "Delivery Cost": deliveryCost.toFixed(2),
          "Total Cost": exportTotal.toFixed(2),
          "Notes": order.notes || ""
        };
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 24 }, // Order ID
        { wch: 12 }, // Order Date
        { wch: 20 }, // Customer Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 30 }, // Address
        { wch: 15 }, // Payment Method
        { wch: 12 }, // Status
        { wch: 40 }, // Products
        { wch: 12 }, // Product Cost
        { wch: 12 }, // Delivery Cost
        { wch: 12 }, // Total Cost
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      setSelectedOrders(orders.map(order => order._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        const newSelected = prev.filter(id => id !== orderId);
        setSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, orderId];
        setSelectAll(newSelected.length === orders.length);
        return newSelected;
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }

    try {
      const loadingToast = toast.loading(`Deleting ${selectedOrders.length} orders...`);
      let successCount = 0;
      let failCount = 0;

      // Delete orders one by one
      for (const orderId of selectedOrders) {
        try {
          await deleteOrder(orderId);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete order ${orderId}:`, error);
          failCount++;
        }
      }

      // Update UI
      toast.dismiss(loadingToast);
      if (failCount === 0) {
        toast.success(`Successfully deleted ${successCount} orders`);
      } else {
        toast.error(`Deleted ${successCount} orders, failed to delete ${failCount} orders`);
      }

      // Refresh orders list and reset selection
      fetchOrders();
      setSelectedOrders([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast.error('Failed to delete selected orders');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;

    const matchesSearch = searchQuery === '' || (
      order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Helper function to check if payment method is instapay (case insensitive)
  const isInstaPay = (method?: string): boolean => {
    if (!method) return false;
    return method.toLowerCase().includes('instapay');
  };

  const calculateOrderTotal = (order: Order): number => {
    // Calculate total without discounts/promos
    const productTotal = order.products.reduce((sum: number, product: OrderProduct) => {
      return sum + (product.price * product.quantity);
    }, 0);
    return productTotal;
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
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <DarkModeInput
                type="search"
                placeholder="Search orders..."
                className="w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex flex-row gap-2 w-full">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] dark:bg-black dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-black dark:border-gray-700">
                    <SelectItem value="all" className="dark:text-gray-100 dark:focus:bg-gray-700">All Status</SelectItem>
                    <SelectItem value="pending" className="dark:text-gray-100 dark:focus:bg-gray-700">Pending</SelectItem>
                    <SelectItem value="processing" className="dark:text-gray-100 dark:focus:bg-gray-700">Processing</SelectItem>
                    <SelectItem value="shipped" className="dark:text-gray-100 dark:focus:bg-gray-700">Shipped</SelectItem>
                    <SelectItem value="delivered" className="dark:text-gray-100 dark:focus:bg-gray-700">Delivered</SelectItem>
                    <SelectItem value="cancelled" className="dark:text-gray-100 dark:focus:bg-gray-700">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={exportOrdersToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800 whitespace-nowrap min-w-fit"
                >
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          <DarkModePanel className="rounded-lg shadow-sm">
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coupon</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders?.map((order) => {
                    if (!order) {
                      console.warn('Invalid order data:', order);
                      return null;
                    }

                    // Get customer name from either format
                    const customerName = (order.customer?.name ?? `${order.firstName ?? ""} ${order.lastName ?? ""}`.trim()) || "Unknown Customer";
                    const customerEmail = order.customer?.email ?? order.email ?? "No email provided";
                    const customerPhone = order.customer?.phone ?? order.phone ?? "No phone provided";
                    const customerAddress = order.customer?.address ?? order.address ?? "No address provided";

                    return (
                      <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleSelectOrder(order._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order._id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customerName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customerEmail}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customerPhone}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customerAddress}
                          </div>
                          {order.products?.length > 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              <strong className="dark:text-gray-300">Products:</strong>
                              <ul className="list-disc pl-5">
                                {order.products.map((item) => (
                                  <li key={item.productId || Math.random()} className="dark:text-gray-400">
                                    {item.name ?? 'Unknown Product'} - {item.size ?? 'N/A'} x {item.quantity ?? 0} - L.E {(item.price ?? 0).toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          L.E {(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={order.status ?? 'pending'}
                            onValueChange={(value: Order['status']) => updateOrderStatus(order._id, value)}
                          >
                            <SelectTrigger className="w-[130px] dark:bg-black dark:border-gray-700">
                              <SelectValue>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status ?? 'pending']}`}>
                                  {(order.status ?? 'pending').charAt(0).toUpperCase() + (order.status ?? 'pending').slice(1)}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="dark:bg-black dark:border-gray-700">
                              <SelectItem value="pending" className="dark:text-gray-100 dark:focus:bg-gray-700">Pending</SelectItem>
                              <SelectItem value="processing" className="dark:text-gray-100 dark:focus:bg-gray-700">Processing</SelectItem>
                              <SelectItem value="shipped" className="dark:text-gray-100 dark:focus:bg-gray-700">Shipped</SelectItem>
                              <SelectItem value="delivered" className="dark:text-gray-100 dark:focus:bg-gray-700">Delivered</SelectItem>
                              <SelectItem value="cancelled" className="dark:text-gray-100 dark:focus:bg-gray-700">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {isInstaPay(order.paymentMethod) ? 'InstaPay' : 'Cash on Delivery'}
                            </span>
                            
                            {isInstaPay(order.paymentMethod) && order.transactionScreenshot && (
                              <PaymentScreenshotViewer 
                                screenshotUrl={order.transactionScreenshot} 
                                paymentMethod={order.paymentMethod}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            // Extract coupon information from all possible sources
                            const couponCode = order.couponCode || 
                                              (order.promoCode && order.promoCode.code) || 
                                              (order.ambassador && order.ambassador.couponCode);
                            
                            const couponDiscount = order.couponDiscount || 
                                                  (order.promoCode && order.promoCode.value) || 
                                                  0;
                            
                            const ambassadorId = order.ambassadorId || 
                                                (order.ambassador && order.ambassador.ambassadorId) || 
                                                undefined; // Remove the ambassadorId reference from promoCode
                            
                            return couponCode ? (
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full 
                                  ${ambassadorId ? 
                                    'bg-purple-100 dark:bg-purple-700 text-purple-800 dark:text-purple-200' : 
                                    'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200'}`}>
                                  {couponCode}
                                </span>
                                {couponDiscount > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {couponDiscount}% off
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">No coupon</span>
                            );
                          })()} 
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="dark:bg-black dark:border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="dark:text-gray-100">Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-gray-400">
                                  This action cannot be undone. This will permanently delete the order.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="dark:bg-black/80 dark:text-white/70 dark:hover:bg-black/60">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteOrder(order._id)} className="dark:bg-red-900 dark:hover:bg-red-800">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
              {filteredOrders?.map((order) => {
                if (!order) {
                  console.warn('Invalid order data in mobile view:', order);
                  return null;
                }

                // Get customer name from either format
                const customerName = (order.customer?.name ?? `${order.firstName ?? ""} ${order.lastName ?? ""}`.trim()) || "Unknown Customer";
                const customerEmail = order.customer?.email ?? order.email ?? "No email provided";
                const customerPhone = order.customer?.phone ?? order.phone ?? "No phone provided";
                const customerAddress = order.customer?.address ?? order.address ?? "No address provided";

                return (
                  <div key={order._id} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {customerName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {customerEmail}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {customerPhone}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            L.E {(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                          </div>
                          {(order.couponCode || order.promoCode?.code) && (
                            <div className="mt-1">
                              <span className={`px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full 
                                ${order.ambassadorId || order.ambassador?.ambassadorId ? 
                                  'bg-purple-100 dark:bg-purple-700 text-purple-800 dark:text-purple-200' : 
                                  'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200'}`}>
                                {order.couponCode || order.promoCode?.code}
                              </span>
                              {(order.couponDiscount || order.promoCode?.value) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {order.couponDiscount || order.promoCode?.value}% off
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {customerAddress}
                      </div>

                      {order.products?.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <strong className="dark:text-gray-300">Products:</strong>
                          <ul className="list-disc pl-5">
                            {order.products.map((item) => (
                              <li key={item.productId || Math.random()} className="text-sm text-gray-600 dark:text-gray-400">
                                {item.name ?? 'Unknown Product'} - {item.size ?? 'N/A'} x {item.quantity ?? 0} - L.E {(item.price ?? 0).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <strong className="dark:text-gray-300">Payment:</strong>{' '}
                        <span className="px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {isInstaPay(order.paymentMethod) ? 'InstaPay' : 'Cash on Delivery'}
                        </span>
                        
                        {isInstaPay(order.paymentMethod) && order.transactionScreenshot && (
                          <div className="mt-1">
                            <PaymentScreenshotViewer 
                              screenshotUrl={order.transactionScreenshot} 
                              paymentMethod={order.paymentMethod}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <Select
                          value={order.status ?? 'pending'}
                          onValueChange={(value: Order['status']) => updateOrderStatus(order._id, value)}
                        >
                          <SelectTrigger className="w-[130px] dark:bg-black dark:border-gray-700">
                            <SelectValue>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status ?? 'pending']}`}>
                                {(order.status ?? 'pending').charAt(0).toUpperCase() + (order.status ?? 'pending').slice(1)}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="dark:bg-black dark:border-gray-700">
                            <SelectItem value="pending" className="dark:text-gray-100 dark:focus:bg-gray-700">Pending</SelectItem>
                            <SelectItem value="processing" className="dark:text-gray-100 dark:focus:bg-gray-700">Processing</SelectItem>
                            <SelectItem value="shipped" className="dark:text-gray-100 dark:focus:bg-gray-700">Shipped</SelectItem>
                            <SelectItem value="delivered" className="dark:text-gray-100 dark:focus:bg-gray-700">Delivered</SelectItem>
                            <SelectItem value="cancelled" className="dark:text-gray-100 dark:focus:bg-gray-700">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm">Delete</button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="dark:bg-black dark:border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="dark:text-gray-100">Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="dark:text-gray-400">
                                This action cannot be undone. This will permanently delete the order.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:bg-black/80 dark:text-white/70 dark:hover:bg-black/60">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteOrder(order._id)} className="dark:bg-red-900 dark:hover:bg-red-800">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DarkModePanel>
        </div>
      </main>
    </div>
  );
} 