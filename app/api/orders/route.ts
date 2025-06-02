import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrderStatus, deleteOrder } from "../../lib/handlers/orderHandler";
import { mongooseConnect } from '../../lib/mongoose';
import { Order } from "../../models/order";
import { headers } from 'next/headers';

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

// Helper function to add CORS headers
function corsHeaders(response: NextResponse, request: Request) {
  // Allow both e-commerce and admin panel domains
  const allowedOrigins = ['https://elevee.netlify.app', 'https://eleveadmin.netlify.app'];
  const requestOrigin = request.headers.get('origin') || '';
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://eleveadmin.netlify.app',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie'
    }
  });
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
export async function GET(request: Request) {
  try {
    // Check authentication
    const headersList = headers();
    const authCookie = headersList.get('cookie');
    if (!authCookie?.includes('admin-auth=true')) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://eleveadmin.netlify.app',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie'
        }
      });
    }

    await mongooseConnect();
    
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean();

    return new NextResponse(JSON.stringify(orders), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://eleveadmin.netlify.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie'
      }
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return new NextResponse(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://eleveadmin.netlify.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie'
      }
    });
  }
}

// Create new order from e-commerce site
export async function POST(request: Request) {
  try {
    console.log('=== New Order Request Received ===');
    console.log('Headers:', {
      origin: request.headers.get('origin'),
      contentType: request.headers.get('content-type')
    });

    await mongooseConnect();
    
    // Parse request body
    const orderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));

    // Extract and normalize coupon information from all possible formats
    const extractCouponInfo = (data: any) => {
      // First check flat fields
      let couponCode = data.couponCode || null;
      let couponDiscount = data.couponDiscount || null;
      let ambassadorId = data.ambassadorId || null;

      // Check ambassador object
      if (!couponCode && data.ambassador) {
        couponCode = data.ambassador.couponCode || null;
        ambassadorId = data.ambassador.ambassadorId || null;
      }

      // Check promoCode object
      if (!couponCode && data.promoCode) {
        couponCode = data.promoCode.code || null;
        // Handle percentage discount
        if (data.promoCode.type === 'percentage') {
          couponDiscount = data.promoCode.value || null;
        }
        ambassadorId = data.promoCode.ambassadorId || null;
      }

      return {
        couponCode,
        couponDiscount,
        ambassadorId
      };
    };

    // Get normalized coupon information
    const couponInfo = extractCouponInfo(orderData);

    // Debug log for coupon information
    if (couponInfo.couponCode) {
      console.log('Normalized Coupon Information:', {
        ...couponInfo,
        originalData: {
          flatFields: {
            couponCode: orderData.couponCode,
            couponDiscount: orderData.couponDiscount,
            ambassadorId: orderData.ambassadorId
          },
          ambassador: orderData.ambassador,
          promoCode: orderData.promoCode
        }
      });
    }

    // Validate required fields
    const requiredFields = {
      firstName: !!orderData.firstName,
      lastName: !!orderData.lastName,
      phone: !!orderData.phone,
      email: !!orderData.email,
      address: !!orderData.address,
      city: !!orderData.city,
      products: Array.isArray(orderData.products) && orderData.products.length > 0,
      total: typeof orderData.total === 'number' && orderData.total > 0
    };

    console.log('Field validation results:', requiredFields);

    if (Object.values(requiredFields).some(field => !field)) {
      console.error('Missing or invalid required fields');
      return corsHeaders(NextResponse.json(
        { 
          error: 'Missing or invalid required fields',
          validation: requiredFields,
          receivedData: orderData 
        },
        { status: 400 }
      ), request);
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
      paymentMethod: orderData.paymentMethod || 'cod',
      transactionScreenshot: orderData.transactionScreenshot || null,
      paymentVerified: orderData.paymentMethod === 'instapay' ? false : true,
      orderDate: new Date(),
      // Add coupon information if present
      ...(couponInfo.couponCode && {
        couponCode: couponInfo.couponCode,
        couponDiscount: couponInfo.couponDiscount,
        ambassadorId: couponInfo.ambassadorId
      })
    };

    console.log('Prepared order data:', JSON.stringify(orderToCreate, null, 2));

    // Create new order
    const newOrder = await Order.create(orderToCreate);
    console.log('Order saved to database:', JSON.stringify(newOrder, null, 2));

    // Always trigger inventory reduction when an order is created
    try {
      console.log('Triggering inventory update for new order:', newOrder._id.toString());
      
      // Call inventory update API - use absolute URL to avoid nextUrl issue
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/inventory/update-from-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: newOrder._id.toString()
        }),
      });
      
      const updateResult = await response.json();
      console.log('Inventory update result:', updateResult);
    } catch (error) {
      console.error('Failed to trigger inventory update:', error);
      // Continue with the order creation even if inventory update fails
    }

    return corsHeaders(NextResponse.json(newOrder, { status: 201 }), request);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error creating order:', {
      message: apiError.message,
      stack: apiError.stack
    });
    return corsHeaders(NextResponse.json(
      { error: apiError.message || 'Failed to create order' },
      { status: 500 }
    ), request);
  }
}

// Update order status
export async function PUT(req: Request) {
  try {
    const { _id, status }: UpdateOrderData = await req.json();
    
    if (!_id || !status) {
      return corsHeaders(NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      ), req);
    }

    const updatedOrder = await updateOrderStatus(_id, status);
    return corsHeaders(NextResponse.json(updatedOrder), req);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error updating order:', apiError);
    return corsHeaders(NextResponse.json(
      { error: apiError.message },
      { status: 500 }
    ), req);
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get('id');

    if (!_id) {
      return corsHeaders(NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      ), req);
    }

    await deleteOrder(_id);
    return corsHeaders(NextResponse.json({ message: 'Order deleted successfully' }), req);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error deleting order:', apiError);
    return corsHeaders(NextResponse.json(
      { error: apiError.message },
      { status: 500 }
    ), req);
  }
} 