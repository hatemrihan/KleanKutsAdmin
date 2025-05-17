import { connectToDatabase } from '../../../../lib/mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Handles file uploads to Cloudinary for category images
 * POST: Upload image file and get back the Cloudinary URL
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // We need to get the FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get file type and validate
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }
    
    // Convert file to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a unique filename
    const extension = fileType.split('/')[1];
    const timestamp = Date.now();
    const filename = `category_${timestamp}.${extension}`;
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'categories',
          public_id: `category_${timestamp}`,
          resource_type: 'image',
          overwrite: true,
          // Add any transformations here
          transformation: [
            { width: 1200, crop: 'limit' }, // Limit width to 1200px
            { quality: 'auto:good' } // Optimize quality
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Convert buffer to stream and pipe to Cloudinary
      const Readable = require('stream').Readable;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
    
    const uploadResult = await uploadPromise as any;
    
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('Error uploading category image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 