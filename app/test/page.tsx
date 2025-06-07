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
      console.log('Deleting order:', orderId);
      
      // Send order ID in request body as expected by the API
      const response = await axios.delete(`/api/orders`, {
        data: { _id: orderId },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response:', response.data);
      
      if (response.status === 200 && response.data) {
        // Remove from local state
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        
        // Remove from selected orders if it was selected
        setSelectedOrders(prevSelected => prevSelected.filter(id => id !== orderId));
        
        toast.success('Order deleted successfully');
        return true; // Return success indicator
      } else {
        throw new Error('Delete request failed');
      }
    } catch (error: any) {
      console.error('Error deleting order:', {
        orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show specific error message if available
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete order';
      toast.error(`Failed to delete order: ${errorMessage}`);
      return false; // Return failure indicator
    }
  };
  
  // Export orders to Excel
  const exportOrdersToExcel = () => {
    try {
      // Prepare data for export with all the columns requested
      const exportData: any[] = [];
      
      orders.forEach(order => {
        // Prepare customer info
        const customerName = (order.customer?.name ?? `${order.firstName ?? ""} ${order.lastName ?? ""}`.trim()) || "Unknown";
        const customerEmail = order.customer?.email ?? order.email ?? "N/A";
        const customerPhone = order.customer?.phone ?? order.phone ?? "N/A";
        const customerAddress = order.customer?.address ?? order.address ?? "N/A";
        
        // Format date
        const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 
                         order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A";
        
        // Extract city and area from address if possible
        const addressParts = customerAddress.split(',').map(part => part.trim());
        const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : "N/A";
        const area = addressParts.length > 2 ? addressParts[addressParts.length - 2] : "N/A";
        const streetAddress = addressParts.length > 2 ? addressParts.slice(0, -2).join(', ') : customerAddress;
        
        // Calculate totals
        const productTotal = order.products.reduce((sum, product) => {
          return sum + (product.price * product.quantity);
        }, 0);
        
        const couponDiscount = order.couponDiscount || 0;
        const originalTotal = order.totalAmount + (productTotal * (couponDiscount / 100) || 0);
        const deliveryCost = Math.max(0, originalTotal - productTotal);
        
        // If there are products, create a row for each product
        if (order.products && order.products.length > 0) {
          order.products.forEach((product, index) => {
            exportData.push({
              "Consignee Name": customerName,
              "City": city,
              "Area": area,
              "Address": streetAddress,
              "Phone_1": customerPhone,
              "Phone_2": "", // Secondary phone if available
              "E-mail": customerEmail,
              "Order ID": order._id,
              "Client ID": order._id.substring(0, 8), // First 8 characters as client ID
              "Item Name": product.name || "Unknown Product",
              "Quantity": product.quantity || 1,
              "Item Description": `${product.name || "Unknown Product"} - Size: ${product.size || "N/A"} - Price: L.E ${(product.price || 0).toFixed(2)}`,
              "Unit Price": (product.price || 0).toFixed(2),
              "Total Item Price": ((product.price || 0) * (product.quantity || 1)).toFixed(2),
              "Order Date": orderDate,
              "Payment Method": order.paymentMethod || "COD",
              "Order Status": order.status || "pending",
              "Coupon Code": order.couponCode || order.promoCode?.code || "N/A",
              "Coupon Discount": couponDiscount > 0 ? `${couponDiscount}%` : "N/A",
              "Ambassador ID": order.ambassadorId || order.ambassador?.ambassadorId || "N/A",
              "Delivery Cost": index === 0 ? deliveryCost.toFixed(2) : "0.00", // Only add delivery cost to first item
              "Order Total": index === 0 ? order.totalAmount.toFixed(2) : "", // Only show total on first item
              "Notes": order.notes || "",
              "Transaction Screenshot": order.transactionScreenshot || "N/A"
            });
          });
        } else {
          // If no products, create a single row
          exportData.push({
            "Consignee Name": customerName,
            "City": city,
            "Area": area,
            "Address": streetAddress,
            "Phone_1": customerPhone,
            "Phone_2": "",
            "E-mail": customerEmail,
            "Order ID": order._id,
            "Client ID": order._id.substring(0, 8),
            "Item Name": "No Products",
            "Quantity": 0,
            "Item Description": "No products found in this order",
            "Unit Price": "0.00",
            "Total Item Price": "0.00",
            "Order Date": orderDate,
            "Payment Method": order.paymentMethod || "COD",
            "Order Status": order.status || "pending",
            "Coupon Code": order.couponCode || order.promoCode?.code || "N/A",
            "Coupon Discount": couponDiscount > 0 ? `${couponDiscount}%` : "N/A",
            "Ambassador ID": order.ambassadorId || order.ambassador?.ambassadorId || "N/A",
            "Delivery Cost": deliveryCost.toFixed(2),
            "Order Total": order.totalAmount.toFixed(2),
            "Notes": order.notes || "",
            "Transaction Screenshot": order.transactionScreenshot || "N/A"
          });
        }
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Consignee Name
        { wch: 15 }, // City
        { wch: 15 }, // Area
        { wch: 35 }, // Address
        { wch: 15 }, // Phone_1
        { wch: 15 }, // Phone_2
        { wch: 25 }, // E-mail
        { wch: 25 }, // Order ID
        { wch: 12 }, // Client ID
        { wch: 25 }, // Item Name
        { wch: 10 }, // Quantity
        { wch: 40 }, // Item Description
        { wch: 12 }, // Unit Price
        { wch: 15 }, // Total Item Price
        { wch: 12 }, // Order Date
        { wch: 15 }, // Payment Method
        { wch: 12 }, // Order Status
        { wch: 15 }, // Coupon Code
        { wch: 15 }, // Coupon Discount
        { wch: 15 }, // Ambassador ID
        { wch: 12 }, // Delivery Cost
        { wch: 12 }, // Order Total
        { wch: 30 }, // Notes
        { wch: 20 }  // Transaction Screenshot
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Export");
      
      // Generate Excel file and trigger download
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `orders_detailed_export_${timestamp}.xlsx`);
      
      toast.success(`Orders exported successfully - ${exportData.length} rows exported`);
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
      const failedOrders: string[] = [];

      // Delete orders one by one and track results
      for (const orderId of selectedOrders) {
        try {
          console.log(`Attempting to delete order: ${orderId}`);
          
          // Send order ID in request body as expected by the API
          const response = await axios.delete(`/api/orders`, {
            data: { _id: orderId },
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Delete response for ${orderId}:`, response.data);
          
          if (response.status === 200) {
            successCount++;
          } else {
            throw new Error(`Delete failed with status ${response.status}`);
          }
        } catch (error: any) {
          console.error(`Failed to delete order ${orderId}:`, {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          failedOrders.push(orderId);
          failCount++;
        }
      }

      // Update local state - remove all successfully deleted orders
      const successfullyDeleted = selectedOrders.filter(id => !failedOrders.includes(id));
      if (successfullyDeleted.length > 0) {
        setOrders(prevOrders => prevOrders.filter(order => !successfullyDeleted.includes(order._id)));
      }

      // Clear selection
      setSelectedOrders([]);
      setSelectAll(false);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show result
      if (failCount === 0) {
        toast.success(`Successfully deleted ${successCount} orders`);
      } else if (successCount === 0) {
        toast.error(`Failed to delete all ${failCount} orders`);
      } else {
        toast.success(`Deleted ${successCount} orders, failed to delete ${failCount} orders`);
      }

      // Refresh the orders list to ensure consistency with database
      console.log('Refreshing orders list after bulk delete...');
      await fetchOrders();
      
    } catch (error: any) {
      console.error('Error in bulk delete:', {
        error: error.message,
        selectedOrders: selectedOrders.length
      });
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
      <main className="flex-1 p-2 sm:p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Page title with Dashboard-style font */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Orders
            </h1>
            <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4 mx-2 sm:mx-0">
            <div className="flex items-center gap-4">
              {/* Title removed since it's already at the top */}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
              <DarkModeInput
                type="search"
                placeholder="Search orders..."
                className="w-full sm:w-[250px] lg:w-[300px] text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] lg:w-[200px] dark:bg-black dark:border-gray-700 dark:text-white text-sm sm:text-base">
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
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800 whitespace-nowrap text-xs sm:text-sm w-full sm:w-auto"
                >
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          <DarkModePanel className="rounded-lg shadow-sm">
            {/* Single Mobile-First Card Layout - No Desktop Table */}
            <div className="p-2 sm:p-4">
              {/* Bulk Actions Header */}
              {selectedOrders.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      {selectedOrders.length} order(s) selected
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="w-full sm:w-auto px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                          Delete Selected
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-black dark:border-gray-700 w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-gray-100">Delete Selected Orders?</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            This will permanently delete {selectedOrders.length} selected orders. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogCancel className="dark:bg-black/80 dark:text-white/70 dark:hover:bg-black/60 w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteSelected} className="dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto">
                            Delete {selectedOrders.length} Orders
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* Check All Orders */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">Select All Orders ({filteredOrders.length})</span>
                </label>
              </div>

              {/* Order Cards */}
              <div className="space-y-3">
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
                    <div key={order._id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        {/* Header with checkbox, name, and amount */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order._id)}
                              onChange={() => handleSelectOrder(order._id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                                {customerName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
                                ID: {order._id.slice(-8)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              L.E {(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Customer details in compact format */}
                        <div className="text-xs space-y-1">
                          <div className="text-gray-600 dark:text-gray-400 break-words flex items-start gap-1">
                            <span className="flex-shrink-0">📧</span>
                            <span className="break-all">{customerEmail}</span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 break-words flex items-start gap-1">
                            <span className="flex-shrink-0">📞</span>
                            <span>{customerPhone}</span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 break-words flex items-start gap-1">
                            <span className="flex-shrink-0">📍</span>
                            <span>{customerAddress}</span>
                          </div>
                        </div>

                        {/* Products in a compact box */}
                        {order.products?.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Products ({order.products.length}):
                            </div>
                            <div className="space-y-1">
                              {order.products.map((item) => (
                                <div key={item.productId || Math.random()} className="text-gray-600 dark:text-gray-400 break-words">
                                  • {item.name ?? 'Unknown Product'} ({item.size ?? 'N/A'}) ×{item.quantity ?? 0} - L.E {(item.price ?? 0).toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Status and Payment in responsive grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Status */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status:</div>
                            <Select
                              value={order.status ?? 'pending'}
                              onValueChange={(value: Order['status']) => updateOrderStatus(order._id, value)}
                            >
                              <SelectTrigger className="w-full h-8 dark:bg-black dark:border-gray-700 text-xs">
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
                          </div>
                          
                          {/* Payment */}
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment:</div>
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 break-words">
                                {isInstaPay(order.paymentMethod) ? 'InstaPay' : 'COD'}
                              </span>
                              {isInstaPay(order.paymentMethod) && order.transactionScreenshot && (
                                <div>
                                  <PaymentScreenshotViewer 
                                    screenshotUrl={order.transactionScreenshot} 
                                    paymentMethod={order.paymentMethod}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Coupon info if available */}
                        {(() => {
                          const couponCode = order.couponCode || 
                                            (order.promoCode && order.promoCode.code) || 
                                            (order.ambassador && order.ambassador.couponCode);
                          
                          const couponDiscount = order.couponDiscount || 
                                                (order.promoCode && order.promoCode.value) || 
                                                0;
                          
                          const ambassadorId = order.ambassadorId || 
                                              (order.ambassador && order.ambassador.ambassadorId) || 
                                              undefined;
                          
                          return couponCode ? (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coupon Applied:</div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full break-words 
                                  ${ambassadorId ? 
                                    'bg-purple-100 dark:bg-purple-700 text-purple-800 dark:text-purple-200' : 
                                    'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200'}`}>
                                  {couponCode}
                                </span>
                                {couponDiscount > 0 && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {couponDiscount}% discount
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Actions */}
                        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-600">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                Delete Order
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="dark:bg-black dark:border-gray-700 w-[95vw] max-w-md mx-auto">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="dark:text-gray-100">Delete Order?</AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-gray-400">
                                  This will permanently delete this order. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel className="dark:bg-black/80 dark:text-white/70 dark:hover:bg-black/60 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteOrder(order._id)} className="dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto">
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
                
                {/* Empty state */}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-4">📦</div>
                    <div className="text-lg font-medium mb-2">No orders found</div>
                    <div className="text-sm">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Orders will appear here when customers place them'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DarkModePanel>
        </div>
      </main>
    </div>
  );
} 