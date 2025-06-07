import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';

// PATCH /api/ambassadors/[id]/payments - Update all payment statuses for an ambassador
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure MongoDB connection
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
    }
    
    const { status } = await request.json();
    const ambassadorId = params.id;
    
    if (!status || !['paid', 'waiting', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (paid, waiting, pending)' },
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
    
    // Update payment status based on the action
    let updateFields: any = {};
    
    if (status === 'paid') {
      // Mark all orders as paid and move pending to paid
      updateFields = {
        $set: {
          'recentOrders.$[].isPaid': true,
          paymentsPaid: ambassador.paymentsPending + (ambassador.paymentsPaid || 0),
          paymentsPending: 0
        }
      };
    } else if (status === 'waiting') {
      // Mark all orders as waiting (not paid) but keep in pending
      updateFields = {
        $set: {
          'recentOrders.$[].isPaid': false
        }
      };
    } else if (status === 'pending') {
      // Reset all to pending
      updateFields = {
        $set: {
          'recentOrders.$[].isPaid': false
        }
      };
    }
    
    // Update the ambassador
    const updatedAmbassador = await Ambassador.findByIdAndUpdate(
      ambassadorId,
      updateFields,
      { new: true }
    );
    
    console.log(`[PAYMENT UPDATE] Bulk payment status updated for ambassador ${ambassadorId} to ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `All payments marked as ${status}`,
      ambassador: updatedAmbassador
    });
    
  } catch (error: any) {
    console.error('[PAYMENT UPDATE] Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
} 