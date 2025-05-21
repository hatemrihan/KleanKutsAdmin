import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create a response that clears the auth cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear the admin-auth cookie
    response.cookies.set('admin-auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Immediate expiration
    });
    
    // Clear any other auth-related cookies
    response.cookies.set('pwd-backup', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      error: 'Error during logout',
      success: false
    }, { 
      status: 500 
    });
  }
} 