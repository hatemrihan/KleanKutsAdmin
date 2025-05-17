import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Admin } from '../../../models/admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // Connect to database if needed
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Parse request
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Simple password check - just use the environment variable or default password
    const adminPassword = process.env.ADMIN_PASSWORD || '012345';
    
    if (password === adminPassword) {
      // Success response
      const response = NextResponse.json({ 
        success: true,
        message: 'Login successful'
      });
      
      // Set authentication cookie
      response.cookies.set('admin-auth', 'true', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // One week
      });
      
      return response;
    }
    
    // Failed login
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Authentication failed'
    }, { status: 500 });
  }
}