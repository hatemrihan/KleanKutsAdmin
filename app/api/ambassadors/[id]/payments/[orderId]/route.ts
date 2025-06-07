import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// PATCH /api/ambassadors/[id]/payments/[orderId] - Update individual order payment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { isPaid } = await request.json();
    const ambassadorId = params.id;
    const orderId = params.orderId;
    
    if (typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { error: 'isPaid must be a boolean value' },
        { status: 400 }
      );
    }
    
    // Find the ambassador
    const ambassador = await Ambassador.findById(ambassadorId);
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    // Find the specific order
    const orderIndex = ambassador.recentOrders.findIndex(
      (order: any) => order.orderId === orderId
    );
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const order = ambassador.recentOrders[orderIndex];
    const wasAlreadyPaid = order.isPaid;
    const commission = order.commission || 0;
    
    // Update the order payment status
    await Ambassador.findByIdAndUpdate(
      ambassadorId,
      {
        $set: {
          [`recentOrders.${orderIndex}.isPaid`]: isPaid
        },
        $inc: {
          // Adjust payment amounts based on status change
          paymentsPending: isPaid ? -commission : (wasAlreadyPaid ? commission : 0),
          paymentsPaid: isPaid ? commission : (wasAlreadyPaid ? -commission : 0)
        }
      }
    );
    
    // Get the updated ambassador
    const updatedAmbassador = await Ambassador.findById(ambassadorId);
    
    console.log(`[PAYMENT UPDATE] Order ${orderId} payment status updated to ${isPaid ? 'paid' : 'pending'} for ambassador ${ambassadorId}`);
    
    return NextResponse.json({
      success: true,
      message: `Order payment status updated to ${isPaid ? 'paid' : 'pending'}`,
      ambassador: updatedAmbassador
    });
    
  } catch (error: any) {
    console.error('[PAYMENT UPDATE] Error updating individual order payment:', error);
    return NextResponse.json(
      { error: 'Failed to update order payment status' },
      { status: 500 }
    );
  }
} 