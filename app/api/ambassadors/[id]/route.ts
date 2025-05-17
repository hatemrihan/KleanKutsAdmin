import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { connectToDatabase } from '@/lib/mongoose';
import { sendAmbassadorApprovalEmail } from '@/app/lib/email';

// GET /api/ambassadors/[id] - Get ambassador by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ambassador ID is required' },
        { status: 400 }
      );
    }
    
    const ambassador = await Ambassador.findById(id);
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ambassador }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ambassador:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ambassador' },
      { status: 500 }
    );
  }
}

// PATCH /api/ambassadors/[id] - Update ambassador details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    console.log('PATCH request received for ambassador ID:', id);
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid ambassador ID is required' },
        { status: 400 }
      );
    }
    
    const updateData = await request.json();
    console.log('Update data received:', updateData);
    
    // Prevent updating certain fields directly for security
    const { _id, userId, email, ...safeUpdateData } = updateData;
    
    // Get current ambassador
    const currentAmbassador = await Ambassador.findById(id);
    if (!currentAmbassador) {
      return NextResponse.json(
        { success: false, error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    console.log('Current ambassador state:', {
      id,
      name: currentAmbassador.name,
      status: currentAmbassador.status,
      isActive: currentAmbassador.isActive
    });
    
    // CRITICAL FIX: Ensure the isActive property exists
    if (typeof currentAmbassador.isActive === 'undefined') {
      console.log('isActive field missing - setting default value true');
      // Add isActive field directly to the document
      await Ambassador.updateOne(
        { _id: id },
        { $set: { isActive: true } }
      );
    }
    
    // Always convert isActive to boolean if it's being updated
    if ('isActive' in safeUpdateData) {
      // Force conversion to boolean to prevent string/number issues
      safeUpdateData.isActive = Boolean(safeUpdateData.isActive);
      console.log('Converted isActive to boolean:', safeUpdateData.isActive);
    }
    
    // Special handling for status changes - send email when ambassador is approved
    let notificationNeeded = false;
    
    if (safeUpdateData.status === 'approved' && currentAmbassador.status !== 'approved') {
      notificationNeeded = true;
    }
    
    // Use findOneAndUpdate with proper parameters
    const updatedAmbassador = await Ambassador.findOneAndUpdate(
      { _id: id },
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedAmbassador) {
      return NextResponse.json(
        { success: false, error: 'Failed to update ambassador' },
        { status: 500 }
      );
    }
    
    console.log('Ambassador updated successfully:', {
      id,
      name: updatedAmbassador.name,
      status: updatedAmbassador.status,
      isActive: updatedAmbassador.isActive,
      fieldsUpdated: Object.keys(safeUpdateData)
    });
    
    // If status changed to approved, send notification email
    if (notificationNeeded) {
      try {
        console.log('Sending approval notification to:', updatedAmbassador.email);
        
        await sendAmbassadorApprovalEmail(
          updatedAmbassador.email,
          updatedAmbassador.name,
          updatedAmbassador.referralCode || 'YOUR_CODE'
        );
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Continue with the response even if notification fails
      }
    }
    
    // Generate message based on what changed
    let message = '';
    if ('status' in safeUpdateData) {
      message = `Ambassador status changed to ${safeUpdateData.status}`;
    } else if ('isActive' in safeUpdateData) {
      message = `Ambassador ${safeUpdateData.isActive ? 'activated' : 'deactivated'} successfully`;
    } else {
      message = 'Ambassador updated successfully';
    }
    
    return NextResponse.json({ 
      success: true,
      ambassador: updatedAmbassador,
      message
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating ambassador:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ambassador status', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/ambassadors/[id] - Delete an ambassador
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Ambassador ID is required' },
        { status: 400 }
      );
    }
    
    const ambassador = await Ambassador.findByIdAndDelete(id);
    
    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Ambassador deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting ambassador:', error);
    return NextResponse.json(
      { error: 'Failed to delete ambassador' },
      { status: 500 }
    );
  }
} 