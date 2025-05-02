import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Admin } from '../../../models/admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // Diagnostic logging
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriStart: process.env.MONGODB_URI?.substring(0, 10) + '...',
      hasAdminPassword: !!process.env.ADMIN_PASSWORD
    });

    // Simple direct connection
    if (!mongoose.connection.readyState) {
      console.log('Attempting direct MongoDB connection...');
      await mongoose.connect(process.env.MONGODB_URI as string, {
        bufferCommands: false,
      });
      console.log('MongoDB connection state:', mongoose.connection.readyState);
    }

    // Parse request
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Simple admin check/create
    let admin = await Admin.findOne();
    if (!admin && process.env.ADMIN_PASSWORD) {
      admin = await Admin.create({
        email: 'kenzyzayed04@gmail.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'admin'
      });
    }

    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Success response
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-auth', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    console.error('Login error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 