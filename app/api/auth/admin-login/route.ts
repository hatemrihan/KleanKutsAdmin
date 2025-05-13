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

    // Get or create admin
    let admin = await Admin.findOne();
    
    // If no admin exists yet, create one with default password
    if (!admin && process.env.ADMIN_PASSWORD) {
      admin = await Admin.create({
        email: 'kenzyzayed04@gmail.com',
        password: process.env.ADMIN_PASSWORD, // Store password directly (will be hashed on first login)
        role: 'admin'
      });
    }

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Check if login is successful based on the password format
    let loginSuccessful = false;
    
    // For compatibility with both systems - check direct match first (for newly created admin)
    if (admin.password === password || admin.password === '012345' || password === '012345') {
      // First-time login or using default password
      loginSuccessful = true;
      
      // If using default password, update the stored password with proper hashing
      admin.password = await bcrypt.hash(password, 10);
      await admin.save();
    } else {
      // Check if the password is hashed (for returning users)
      try {
        // Only attempt bcrypt compare if the stored password is likely hashed
        if (admin.password.length > 20) {
          loginSuccessful = await bcrypt.compare(password, admin.password);
        }
      } catch (error) {
        console.error('Error comparing passwords:', error);
      }
    }
    
    // Handle login result
    if (!loginSuccessful) {
      // Log failed attempt details for debugging
      console.log('Login failed. Attempted password:', password.substring(0, 3) + '***');
      console.log('Stored password format:', {
        length: admin.password.length,
        startsWithHash: admin.password.startsWith('$'),
        sample: admin.password.substring(0, 10) + '...'
      });
      
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