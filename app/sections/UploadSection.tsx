'use client';

import Image from 'next/image';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface UploadSectionProps {
  selectedImages: string[];
  setSelectedImages: Dispatch<SetStateAction<string[]>>;
}

// Maximum file size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadSection({ selectedImages, setSelectedImages }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Function to handle file uploads
  const uploadFile = async (file: File) => {
    // Validate file size before uploading
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload with progress tracking
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
        timeout: 60000, // 60 second timeout - increased for larger files
      });

      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in uploadFile function:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.error || `Upload failed: ${error.message}`);
      }
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    // Limit to a reasonable number of files (e.g., 10) to prevent overwhelming the server
    const filesToUpload = acceptedFiles.slice(0, 10);
    
    // Show warning if files were truncated
    if (filesToUpload.length < acceptedFiles.length) {
      console.warn(`Only uploading the first ${filesToUpload.length} of ${acceptedFiles.length} files`);
    }

    console.log(`Starting upload of ${filesToUpload.length} files`);
    
    try {
      // Process one file at a time to avoid overwhelming mobile devices
      for (const file of filesToUpload) {
        try {
          console.log(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          const data = await uploadFile(file);
          if (data?.url) {
            console.log(`Successfully uploaded: ${file.name} → ${data.url}`);
            setSelectedImages(prev => [...prev, data.url]);
          } else {
            console.error(`Missing URL in upload response for ${file.name}:`, data);
            setError(`Failed to get URL for ${file.name}. Please try again.`);
          }
        } catch (fileError: any) {
          console.error(`Error uploading ${file.name}:`, fileError);
          setError(fileError.message || `Failed to upload ${file.name}`);
          break; // Stop on first error
        }
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // Handle network or timeout errors
        if (error.code === 'ECONNABORTED') {
          setError('Upload timed out. Please try with a smaller image or check your connection.');
        } else {
          const errorMsg = error.response?.data?.error || 'Failed to upload image(s)';
          setError(errorMsg);
          console.error('Upload error response:', error.response?.data);
        }
        console.error('Upload error:', error.message);
      } else {
        setError(error.message || 'Failed to upload image(s)');
        console.error('Upload error:', error);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [setSelectedImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    // Disable drag and drop on mobile as it's less reliable
    noDrag: typeof window !== 'undefined' && window.innerWidth < 768
  });

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-black p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-semibold mb-6 text-black dark:text-white">Product Images</h2>
      {error && (
        <div className="mb-4 p-3 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          {error}
          <button 
            className="ml-2 text-red-700 dark:text-red-400 font-medium" 
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-700'}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="text-gray-500 dark:text-gray-400">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                  <div className="bg-blue-500 dark:bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          ) : isDragActive ? (
            <p className="text-blue-500 dark:text-blue-400">Drop the files here</p>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              <p className="font-medium">Tap to select images</p>
              <p className="text-sm mt-1">Supports: JPG, PNG, WebP (max 10MB)</p>
            </div>
          )}
        </div>
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selectedImages.map((img, index) => (
              <div key={index} className="relative aspect-square group">
                <Image
                  src={img}
                  alt={`Product ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  priority={index < 4} // Prioritize loading the first 4 images
                  unoptimized={true} // Add this for Cloudinary images
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}