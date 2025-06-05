import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { Ambassador } from '@/app/models/ambassador';
import { responseWithCors, handleCorsOptions } from '../../../../lib/cors';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log('[VIDEO LINK API] OPTIONS preflight request received');
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    console.log('[VIDEO LINK API] Processing POST request from origin:', request.headers.get('origin'));
    
    // Parse request body
    const { email, productVideoLink } = await request.json();
    console.log('[VIDEO LINK API] Request data:', { email, productVideoLink: productVideoLink?.substring(0, 50) + '...' });

    if (!email || !productVideoLink) {
      console.log('[VIDEO LINK API] Missing required fields');
      return responseWithCors({ error: 'Missing required fields' }, 400, request);
    }

    await connectToDatabase();

    // Update ambassador record
    const ambassador = await Ambassador.findOneAndUpdate(
      { email },
      { 
        $set: { 
          productVideoLink,
          videoSubmissionDate: new Date()
        }
      },
      { new: true }
    );

    if (!ambassador) {
      console.log('[VIDEO LINK API] Ambassador not found for email:', email);
      return responseWithCors({ error: 'Ambassador not found' }, 404, request);
    }
    
    console.log('[VIDEO LINK API] Successfully updated video link for ambassador:', ambassador.name);
    
    return responseWithCors({ 
      success: true,
      message: 'Link updated successfully',
      ambassador
    }, 200, request);

  } catch (error: any) {
    console.error('[VIDEO LINK API] Error updating link:', error);
    return responseWithCors({ 
      error: 'Failed to update link',
      details: error.message 
    }, 500, request);
  }
} 