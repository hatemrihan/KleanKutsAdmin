'use client';

import React, { useState, useEffect } from 'react';

interface PaymentScreenshotViewerProps {
  screenshotUrl: string;
  paymentMethod?: string;
}

export default function PaymentScreenshotViewer({ screenshotUrl, paymentMethod = 'instapay' }: PaymentScreenshotViewerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Make sure the URL is usable
  const cleanUrl = screenshotUrl ? screenshotUrl.trim() : '';
  
  useEffect(() => {
    // Debug log the screenshot URL
    console.log('PaymentScreenshotViewer received URL:', screenshotUrl);
    
    if (cleanUrl) {
      // Pre-load image to check if it's valid
      const img = new Image();
      img.onload = () => {
        console.log('Screenshot image loaded successfully:', cleanUrl);
        setImageError(false);
      };
      img.onerror = () => {
        console.error('Screenshot image failed to load:', cleanUrl);
        setImageError(true);
      };
      img.src = getProperUrl(cleanUrl);
    }
  }, [cleanUrl]);
  
  if (!cleanUrl) {
    console.warn('PaymentScreenshotViewer received empty URL');
    return null;
  }
  
  // Handle different URL formats
  const getProperUrl = (url: string) => {
    // Log the original URL for debugging
    console.log('Processing URL:', url);
    
    // If it starts with http or https, it's already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a Cloudinary URL but missing the scheme
    if (url.includes('res.cloudinary.com') && !url.startsWith('http')) {
      return `https://${url.replace(/^\/+/, '')}`;
    }
    
    // If it starts with a slash, append it to the base URL
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // Otherwise, treat as relative to the current path
    return `${window.location.origin}/${url}`;
  };
  
  const imageUrl = getProperUrl(cleanUrl);
  
  return (
    <div className="payment-screenshot-viewer">
      <a 
        href={imageUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        onClick={(e) => {
          // If we've detected an image error, show a warning
          if (imageError) {
            alert('The screenshot image might be unavailable. Opening URL anyway.');
          }
          
          if (!showFullImage) {
            e.preventDefault();
            setShowFullImage(true);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        View {paymentMethod.toLowerCase().includes('instapay') ? 'InstaPay' : 'Payment'} Screenshot
        
        {imageError && (
          <span className="text-red-500 ml-1">(Warning: Image may be unavailable)</span>
        )}
      </a>
      
      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative bg-white dark:bg-gray-900 p-2 rounded-lg max-w-3xl max-h-[90vh] overflow-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={() => setShowFullImage(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="flex flex-col items-center">
              {!isImageLoaded && (
                <div className="animate-pulse flex space-x-4 mb-4">
                  <div className="bg-gray-300 dark:bg-gray-700 h-48 w-48 rounded"></div>
                </div>
              )}
              
              <img
                src={imageUrl}
                alt="Payment Screenshot"
                className={`max-h-[80vh] max-w-full ${isImageLoaded ? 'block' : 'hidden'}`}
                onLoad={() => {
                  console.log('Image loaded in viewer:', imageUrl);
                  setIsImageLoaded(true);
                  setImageError(false);
                }}
                onError={(e) => {
                  console.error('Error loading image in viewer:', imageUrl);
                  setImageError(true);
                  e.currentTarget.src = 'https://placehold.co/400x600/EEE/31343C?text=Screenshot+Not+Available';
                  setIsImageLoaded(true); // Still set loaded to show the placeholder
                }}
              />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {paymentMethod.toLowerCase().includes('instapay') ? 'InstaPay' : 'Payment'} Screenshot
                </p>
                {imageError ? (
                  <p className="text-xs text-red-500 mt-1">
                    The original image could not be loaded. There might be an issue with the URL.
                  </p>
                ) : null}
                <a 
                  href={imageUrl} 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-xs text-blue-600 dark:text-blue-400 mt-2 inline-block"
                >
                  Open in new tab
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  URL: {imageUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 