'use client';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Nav from '../sections/nav';
import { Input } from '../components/ui/input';
import { config } from '../../config';
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
  paymentMethod?: 'cod' | 'instapay';
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
  couponCode?: string;
  couponDiscount?: number;
  ambassadorId?: string;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get('/api/orders');
      console.log('Raw orders data:', response.data);
      
      // Debug log for coupon information
      response.data.forEach((order: any) => {
        if (order.couponCode) {
          console.log('Order with coupon found:', {
            orderId: order._id,
            couponCode: order.couponCode,
            couponDiscount: order.couponDiscount,
            ambassadorId: order.ambassadorId
          });
        }
      });
      
      // Transform and validate orders data
      const validatedOrders = response.data.map((order: any) => {
        // Skip invalid orders
        if (!order) return null;

        // Debug payment method and screenshots
        if (order.paymentMethod || order.transactionScreenshot) {
          console.log('DEBUG Order payment data:', {
            id: order._id,
            paymentMethod: order.paymentMethod,
            hasScreenshot: !!order.transactionScreenshot,
            screenshotUrl: order.transactionScreenshot
          });
        }

        // Debug coupon information
        if (order.couponCode) {
          console.log('DEBUG Coupon data:', {
            id: order._id,
            couponCode: order.couponCode,
            couponDiscount: order.couponDiscount,
            ambassadorId: order.ambassadorId
          });
        }

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
            paymentMethod: order.paymentMethod || 'cod',
            transactionScreenshot: order.transactionScreenshot || null,
            // Preserve coupon information
            couponCode: order.couponCode || null,
            couponDiscount: order.couponDiscount || null,
            ambassadorId: order.ambassadorId || null,
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
        
        // Ensure payment fields are preserved
        order.paymentMethod = order.paymentMethod || 'cod';
        
        // Make sure we preserve the transactionScreenshot if it exists
        if (order.transactionScreenshot) {
          console.log('Found transaction screenshot URL:', order.transactionScreenshot);
        }

        // Preserve coupon information
        order.couponCode = order.couponCode || null;
        order.couponDiscount = order.couponDiscount || null;
        order.ambassadorId = order.ambassadorId || null;

        return order;
      }).filter(Boolean); // Remove any null orders
      
      console.log('Validated orders:', validatedOrders);
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

  // Helper function to check if payment method is instapay (case insensitive)
  const isInstaPay = (method?: string): boolean => {
    if (!method) return false;
    return method.toLowerCase().includes('instapay');
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <DarkModeInput
                type="search"
                placeholder="Search orders..."
                className="w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
            </div>
          </div>

          <DarkModePanel className="rounded-lg shadow-sm">
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coupon</th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
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

                            {order.couponCode && (
                              <div className="mt-1">
                                <div className="flex flex-col gap-1">
                                  <span className="px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200">
                                    {order.couponCode}
                                  </span>
                                  {order.couponDiscount && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {order.couponDiscount}% off
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'No date'}
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
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'No date'}
                          </div>
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

                      {order.couponCode && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <strong className="dark:text-gray-300">Coupon Applied:</strong>{' '}
                          <span className="px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200">
                            {order.couponCode}
                          </span>
                          {order.couponDiscount && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              ({order.couponDiscount}% off)
                            </span>
                          )}
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