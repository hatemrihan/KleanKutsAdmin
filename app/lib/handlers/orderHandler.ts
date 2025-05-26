import { mongooseConnect } from "../mongoose";
import { Order } from "../../models/order";

interface OrderData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  notes?: string;
  products: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    image?: string;
  }>;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  ambassadorId?: string;
}

export async function createOrder(orderData: OrderData) {
  try {
    await mongooseConnect();

    // Validate required fields
    if (!orderData.firstName || !orderData.lastName || !orderData.phone || 
        !orderData.email || !orderData.address || !orderData.city || 
        !orderData.products || !orderData.total) {
      throw new Error('Missing required fields');
    }

    // Prepare the order data
    const orderToCreate = {
      customer: {
        name: `${orderData.firstName} ${orderData.lastName}`,
        email: orderData.email,
        phone: orderData.phone,
        address: `${orderData.address}${orderData.apartment ? `, ${orderData.apartment}` : ''}, ${orderData.city}`
      },
      products: orderData.products,
      totalAmount: orderData.total,
      notes: orderData.notes || '',
      status: 'pending',
      orderDate: new Date(),
      // Add coupon information if present
      ...(orderData.couponCode && { 
        couponCode: orderData.couponCode,
        couponDiscount: orderData.couponDiscount,
        ambassadorId: orderData.ambassadorId
      })
    };

    // Create the order
    const order = await Order.create(orderToCreate);
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function getOrders() {
  try {
    await mongooseConnect();
    const orders = await Order.find({ deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .select('-__v') // Exclude only the __v field to ensure we get all other fields
      .lean();
    
    // Log the first order to check for all relevant fields including coupon info
    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log('Sample order from MongoDB (handler):', JSON.stringify({
        _id: firstOrder._id,
        paymentMethod: firstOrder.paymentMethod,
        transactionScreenshot: firstOrder.transactionScreenshot,
        hasScreenshot: !!firstOrder.transactionScreenshot,
        couponCode: firstOrder.couponCode,
        couponDiscount: firstOrder.couponDiscount,
        ambassadorId: firstOrder.ambassadorId
      }, null, 2));
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderById(id: string) {
  try {
    await mongooseConnect();
    const order = await Order.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    await mongooseConnect();
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

export async function deleteOrder(id: string) {
  try {
    await mongooseConnect();
    const order = await Order.findByIdAndUpdate(
      id,
      { 
        deleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
} 