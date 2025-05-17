import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check for the admin-auth cookie
    const adminAuth = request.cookies.get('admin-auth');
    
    // Return authentication status
    if (adminAuth?.value === 'true') {
      return NextResponse.json({ 
        authenticated: true,
        method: 'cookie'
      });
    }
    
    // Not authenticated
    return NextResponse.json({ 
      authenticated: false 
    }, { 
      status: 401 
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      error: 'Error checking authentication status',
      authenticated: false
    }, { 
      status: 500 
    });
  }
} 