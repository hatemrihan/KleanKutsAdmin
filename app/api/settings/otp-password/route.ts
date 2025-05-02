import { NextResponse } from 'next/server';
import { mongooseConnect } from '../../../lib/mongoose';
import { Admin } from '../../../models/admin';

export async function PUT(req: Request) {
  try {
    await mongooseConnect();
    
    const { currentPassword, newPassword } = await req.json();

    // For testing purposes, check if current password matches '012345'
    if (currentPassword !== '012345') {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update the admin password in the database
    const admin = await Admin.findOne();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    admin.password = newPassword;
    await admin.save();

    return NextResponse.json({ 
      success: true,
      message: 'OTP password updated successfully'
    });

  } catch (error) {
    console.error('Error updating OTP password:', error);
    return NextResponse.json(
      { error: 'Failed to update OTP password' },
      { status: 500 }
    );
  }
} 