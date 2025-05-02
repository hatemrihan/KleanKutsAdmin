'use client';

import Image from 'next/image';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface UploadSectionProps {
  selectedImages: string[];
  setSelectedImages: Dispatch<SetStateAction<string[]>>;
}

export default function UploadSection({ selectedImages, setSelectedImages }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        // Validate file size before uploading
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          setError(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('/api/upload', formData);
        if (response.data?.url) {
          setSelectedImages(prev => [...prev, response.data.url]);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to upload image(s)');
        console.error('Upload error:', error.response?.data);
      } else {
        setError('Failed to upload image(s)');
        console.error('Upload error:', error);
      }
    } finally {
      setIsUploading(false);
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
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Upload Images</h2>
      {error && (
        <div className="mb-4 p-2 text-red-500 text-sm bg-red-50 rounded">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              Uploading...
            </div>
          ) : isDragActive ? (
            <p className="text-green-500">Drop the files here</p>
          ) : (
            <div className="text-gray-500">
              <p>Drag and drop images here, or click to select files</p>
              <p className="text-sm mt-1">Supports: JPG, PNG, WebP</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {selectedImages.map((img, index) => (
            <div key={index} className="relative aspect-square group">
              <Image
                src={img}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 