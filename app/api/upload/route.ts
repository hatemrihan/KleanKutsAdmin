import { NextResponse } from 'next/server';

// Configure upload settings
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Cloudinary configuration - hardcoded for reliability in production
const CLOUDINARY_CLOUD_NAME = 'dvcs7czio';
const CLOUDINARY_UPLOAD_PRESET = 'kleankuts_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function POST(req: Request) {
  console.log('Upload API called');
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
      return NextResponse.json(
        { error: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!VALID_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}. Allowed types: ${VALID_TYPES.join(', ')}`);
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      // Convert file to base64 for Cloudinary upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');
      const fileType = file.type;
      const base64File = `data:${fileType};base64,${base64Data}`;
      
      // Create a new FormData for Cloudinary
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', base64File);
      cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'kleankuts_upload');
      
      // Add additional parameters (only those allowed with unsigned uploads)
      // Add folder for organization
      cloudinaryFormData.append('folder', 'samples/ecommerce');
      
      // Add tags for better organization
      cloudinaryFormData.append('tags', 'kleankuts,product');
      
      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: cloudinaryFormData
      });
      
      if (!cloudinaryResponse.ok) {
        const errorData = await cloudinaryResponse.json();
        console.error('Cloudinary upload failed:', errorData);
        return NextResponse.json(
          { error: `Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
      
      const cloudinaryData = await cloudinaryResponse.json();
      console.log('Cloudinary upload successful:', cloudinaryData.secure_url);
      
      // Return the Cloudinary URL
      return NextResponse.json({ url: cloudinaryData.secure_url });
    } catch (uploadError: any) {
      console.error('Error uploading to Cloudinary:', uploadError);
      return NextResponse.json(
        { error: `Error uploading to Cloudinary: ${uploadError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('General error in upload API:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}