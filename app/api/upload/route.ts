import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Configure upload settings
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Increased to 5MB
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Ensure upload directory exists
async function ensureUploadDirectory() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Use synchronous check and create to avoid race conditions
    if (!existsSync(uploadDir)) {
      console.log('Upload directory does not exist, creating:', uploadDir);
      try {
        mkdirSync(uploadDir, { recursive: true });
        console.log('Created upload directory successfully');
      } catch (mkdirError) {
        console.error('Failed to create directory synchronously:', mkdirError);
        // Fall back to async method
        await mkdir(uploadDir, { recursive: true });
      }
    } else {
      console.log('Upload directory already exists');
    }
    
    return uploadDir;
  } catch (error) {
    console.error('Error in ensureUploadDirectory:', error);
    throw new Error(`Failed to ensure upload directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function POST(req: Request) {
  console.log('Upload API called');
  
  let uploadDir = '';
  
  try {
    // Ensure upload directory exists first
    uploadDir = await ensureUploadDirectory();
    console.log('Upload directory ready:', uploadDir);
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.error('No file provided in the request');
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
      console.error(`Invalid file type: ${file.type}`);
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only JPEG, PNG and WebP are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 3MB.` },
        { status: 400 }
      );
    }

    // Process file
    try {
      // Read file data
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename with original extension
      const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
      const extension = path.extname(originalName) || '.jpg'; // Default to jpg if no extension
      const filename = `${Date.now()}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Write file
      await writeFile(filePath, buffer);
      console.log('File saved successfully:', filePath);

      // Return URL path - ensure it's properly formatted for the frontend
      const urlPath = `/uploads/${filename}`;
      console.log('Returning URL path:', urlPath);
      
      // Verify the file exists after writing
      if (existsSync(filePath)) {
        return NextResponse.json({ 
          url: urlPath,
          message: 'File uploaded successfully',
          filename: filename
        });
      } else {
        console.error('File was not found after writing:', filePath);
        return NextResponse.json(
          { error: 'File was saved but could not be verified. Please try again.' },
          { status: 500 }
        );
      }
    } catch (fileError: any) {
      console.error('Error processing file:', fileError?.message || fileError);
      return NextResponse.json(
        { error: `Error processing file: ${fileError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload API error:', error?.message || error, error?.stack);
    return NextResponse.json(
      { error: 'Server error during file upload. Please try again.' },
      { status: 500 }
    );
  }
}