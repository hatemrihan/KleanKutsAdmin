import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrderStatus, deleteOrder } from "../../lib/handlers/orderHandler";
import { mongooseConnect } from '../../lib/mongoose';
import { Order } from "../../models/order";
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { responseWithCors, handleCorsOptions } from '../../../lib/cors';

interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

interface OrderData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  notes?: string;
  products: OrderProduct[];
  total: number;
  paymentMethod?: string;
  transactionScreenshot?: string;
  couponCode?: string;
  couponDiscount?: number;
  ambassadorId?: string;
}

interface UpdateOrderData {
  _id: string;
  status: string;
}

interface ApiError extends Error {
  message: string;
}

interface IncomingOrderData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  city: string;
  notes?: string;
  products: string[];  // Array of product IDs
  total: number;      // Total amount
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

// Middleware to check API key
async function validateApiKey(request: Request) {
  // Skip API key validation for requests from the admin panel
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  
  console.log('Validating API key:', {
    referer,
    origin,
    hasApiKey: !!request.headers.get('X-API-Key'),
    isAdminPanel: referer.includes('eleveadmin.netlify.app') || 
                 
                 origin.includes('eleveadmin.netlify.app') 
                
  });

  if (referer.includes('eleveadmin.netlify.app') || 
      origin.includes('eleveadmin.netlify.app')) {
    return;
  }

  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey !== validApiKey) {
    console.error('API key validation failed:', {
      providedKey: apiKey ? apiKey.substring(0, 5) + '...' : 'none',
      expectedKey: validApiKey ? validApiKey.substring(0, 5) + '...' : 'none'
    });
    throw new Error('Invalid or missing API key');
  }
}

// Get all orders
export async function GET(request: NextRequest) {
  try {
    await mongooseConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query based on status filter
    let query: any = {};
    if (status && status !== 'all') {
      if (status === 'active') {
        // Active means not cancelled
        query.status = { $nin: ['cancelled'] };
      } else {
        query.status = status;
      }
    }
    
    // Get orders with proper population
    const orders = await Order.find(query)
      .sort({ createdAt: -1 });
    
    return responseWithCors(orders, 200, request);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return responseWithCors(
      { error: error.message || 'Failed to fetch orders' },
      500,
      request
    );
  }
}

// Create new order from e-commerce site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[ORDER CREATION] Request body:', JSON.stringify(body, null, 2));
    
    const {
      items,
      shippingInfo,
      total,
      promocode, // This is the coupon code from e-commerce
      transactionScreenshot,
      paymentMethod = 'cod'
    } = body;

    // Validate required fields
    const requiredFields = {
      items: items && Array.isArray(items) && items.length > 0,
      shippingInfo: shippingInfo && 
                   shippingInfo.fullName && 
                   shippingInfo.address && 
                   shippingInfo.city && 
                   shippingInfo.phone,
      total: total && typeof total === 'number' && total > 0,
    };

    if (Object.values(requiredFields).some(field => !field)) {
      console.error('[ORDER CREATION] Missing or invalid required fields');
      return responseWithCors(
        { 
          error: 'Missing or invalid required fields',
          details: requiredFields
        },
        400,
        request
      );
    }

    await mongooseConnect();

    // Handle coupon code and ambassador tracking
    let ambassadorId = null;
    let couponDiscount = 0;
    let finalCouponCode = null;

    if (promocode) {
      console.log('[ORDER CREATION] Processing coupon code:', promocode);
      
      // Import Ambassador model
      const { Ambassador } = await import("../../models/ambassador");
      
      // Find ambassador with this coupon code
      const ambassador = await Ambassador.findOne({
        $or: [
          { couponCode: { $regex: new RegExp(`^${promocode.trim()}$`, 'i') }, status: 'approved', isActive: true },
          { referralCode: { $regex: new RegExp(`^${promocode.trim()}$`, 'i') }, status: 'approved', isActive: true }
        ]
      });

      if (ambassador) {
        console.log('[ORDER CREATION] Found ambassador:', ambassador.name);
        ambassadorId = ambassador._id;
        finalCouponCode = promocode;
        
        // Calculate discount based on ambassador's discount percent
        couponDiscount = (total * ambassador.discountPercent) / 100;
        
        console.log('[ORDER CREATION] Calculated discount:', couponDiscount);
        
        // Update ambassador stats immediately
        // Note: This is a legacy API - commission should ideally be calculated on product subtotal only
        // But for backward compatibility with existing orders, we'll use total for now
        // TODO: Update to use subtotal when e-commerce system provides it
        const commission = total * ambassador.commissionRate;
        
        await Ambassador.findByIdAndUpdate(
          ambassador._id,
          {
            $inc: {
              sales: total,
              earnings: commission,
              orders: 1,
              paymentsPending: commission
            },
            $push: {
              recentOrders: {
                orderId: `ORD-${Date.now()}`, // Will update with real order ID later
                orderDate: new Date(),
                amount: total,
                commission,
                isPaid: false
              }
            }
          }
        );
        
        console.log('[ORDER CREATION] Updated ambassador stats:', {
          ambassadorId: ambassador._id,
          sales: total,
          commission,
          orders: 1
        });
      } else {
        console.log('[ORDER CREATION] No valid ambassador found for coupon:', promocode);
      }
    }

    // Create order with proper structure matching the schema
    const orderData = {
      customer: {
        name: shippingInfo.fullName,
        email: shippingInfo.email || 'customer@example.com',
        phone: shippingInfo.phone,
        address: `${shippingInfo.address}, ${shippingInfo.city}`
      },
      products: items.map((item: any) => ({
        productId: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image
      })),
      totalAmount: total,
      paymentMethod: paymentMethod,
      transactionScreenshot: transactionScreenshot || null,
      status: 'pending',
      orderDate: new Date(),
      couponCode: finalCouponCode, // Store the coupon code
      couponDiscount: couponDiscount, // Store the discount amount
      ambassadorId: ambassadorId // Store the ambassador ID
    };

    console.log('[ORDER CREATION] Creating order with data:', JSON.stringify(orderData, null, 2));

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update the ambassador's recent order with the real order ID
    if (ambassadorId && finalCouponCode) {
      const { Ambassador } = await import("../../models/ambassador");
      await Ambassador.findByIdAndUpdate(
        ambassadorId,
        {
          $set: {
            "recentOrders.$[elem].orderId": newOrder._id.toString()
          }
        },
        {
          arrayFilters: [{ "elem.orderId": { $regex: /^ORD-/ } }],
          sort: { "recentOrders.orderDate": -1 }
        }
      );
    }
    
    console.log('[ORDER CREATION] Order created successfully:', newOrder._id);

    return responseWithCors({
      success: true,
      orderId: newOrder._id,
      order: newOrder
    }, 201, request);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('[ORDER CREATION] Error creating order:', {
      message: apiError.message,
      stack: apiError.stack
    });
    return responseWithCors(
      { error: apiError.message || 'Failed to create order' },
      500,
      request
    );
  }
}

// Update order status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, status } = body;
    
    if (!_id || !status) {
      return responseWithCors(
        { error: 'Order ID and status are required' },
        400,
        req
      );
    }

    await mongooseConnect();

    const updatedOrder = await updateOrderStatus(_id, status);
    return responseWithCors(updatedOrder, 200, req);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error updating order:', apiError);
    return responseWithCors(
      { error: apiError.message },
      500,
      req
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return responseWithCors(
        { error: 'Order ID is required' },
        400,
        req
      );
    }

    await mongooseConnect();

    await deleteOrder(_id);
    return responseWithCors({ message: 'Order deleted successfully' }, 200, req);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error deleting order:', apiError);
    return responseWithCors(
      { error: apiError.message },
      500,
      req
    );
  }
} 