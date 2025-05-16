'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface CategoryImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  label?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function CategoryImageUpload({ onImageUploaded, label = 'Upload Image' }: CategoryImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const uploadFile = async (file: File) => {
    // Validate file size before uploading
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File is too large. Maximum size is 10MB.`);
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
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
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.error || 'Upload failed');
      }
      throw error;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setError('');
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const file = acceptedFiles[0]; // Only use the first file
        const data = await uploadFile(file);
        if (data?.url) {
          onImageUploaded(data.url);
        } else {
          setError('Failed to get URL from upload response');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <div>
      <p className="text-sm mb-1">{label}</p>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="text-gray-500 py-2">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2" />
            Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 py-2">
            <p className="text-sm">{isDragActive ? 'Drop image here' : 'Click or drag an image'}</p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
} 