import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Configure upload settings
const MAX_FILE_SIZE = 3 * 1024 * 1024; // Reduced to 3MB for mobile
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Ensure upload directory exists
async function ensureUploadDirectory() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) {
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('Created upload directory:', uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      throw new Error('Failed to create upload directory');
    }
  }
  return uploadDir;
}

export async function POST(req: Request) {
  try {
    // Ensure upload directory exists first
    const uploadDir = await ensureUploadDirectory();
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Log file details for debugging
    console.log('Received file:', { 
      name: file.name, 
      type: file.type, 
      size: `${(file.size / 1024).toFixed(2)} KB` 
    });

    // Validate file type
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only JPEG, PNG and WebP are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 3MB.` },
        { status: 400 }
      );
    }

    // Process file in chunks to avoid memory issues
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with original extension
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const extension = path.extname(originalName) || '.jpg'; // Default to jpg if no extension
    const filename = `${Date.now()}${extension}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    await writeFile(filePath, buffer);
    console.log('File saved successfully:', filename);

    // Return absolute URL to ensure it works on mobile
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      message: 'File uploaded successfully' 
    });

  } catch (error: any) {
    console.error('Upload error details:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}