import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if the admin-auth cookie exists and is valid
    const adminAuthCookie = request.cookies.get('admin-auth');
    
    if (adminAuthCookie && adminAuthCookie.value === 'true') {
      return NextResponse.json({
        authenticated: true,
        source: 'cookie'
      });
    }
    
    // Not authenticated
    return NextResponse.json({
      authenticated: false
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Authentication check failed'
    }, { status: 500 });
  }
} 