import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrderStatus, deleteOrder } from "../../lib/handlers/orderHandler";
import { mongooseConnect } from '../../lib/mongoose';
import { Order } from "../../models/order";

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
  return corsHeaders(new NextResponse(null, { status: 200 }), request);
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
                 referer.includes('localhost:3003') ||
                 origin.includes('eleveadmin.netlify.app') ||
                 origin.includes('localhost:3003')
  });

  if (referer.includes('eleveadmin.netlify.app') || 
      referer.includes('localhost:3000') ||
      origin.includes('eleveadmin.netlify.app') ||
      origin.includes('localhost:3000')) {
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
    await mongooseConnect();
    const orders = await getOrders();
    return corsHeaders(NextResponse.json(orders), request);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('GET orders error:', apiError);
    return corsHeaders(NextResponse.json(
      { error: apiError.message },
      { status: 500 }
    ), request);
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
      orderDate: new Date()
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