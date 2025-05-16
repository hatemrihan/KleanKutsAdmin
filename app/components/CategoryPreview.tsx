'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryPreviewProps {  category: {    _id: string;    name: string;    headline?: string;    subheadline?: string;    desktopDescription?: string;    mobileDescription?: string;    image?: string | null;    mobileImage?: string | null;    additionalImages?: string[];    callToAction?: {      text: string;      link: string;    };    customStyles?: {      textColor: string;      backgroundColor: string;      overlayOpacity: number;    };    layout?: {      desktop?: {        imagePosition: 'left' | 'right' | 'center';        textAlignment: 'left' | 'right' | 'center';      };      mobile?: {        imagePosition: 'top' | 'bottom' | 'center';        textAlignment: 'left' | 'right' | 'center';      };    };    isActive?: boolean;  };  isMobile?: boolean;}

export default function CategoryPreview({ category, isMobile = false }: CategoryPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = category.additionalImages && category.additionalImages.length > 0;
  
  // Determine the images to display
  const mainImage = isMobile && category.mobileImage ? category.mobileImage : category.image;
  const images = [mainImage, ...(category.additionalImages || [])].filter(Boolean) as string[];
  
  // Determine the layout
  const layout = isMobile ? category.layout?.mobile : category.layout?.desktop;
  const description = isMobile ? category.mobileDescription : category.desktopDescription;

  // For the specific showcase style in the user's example with top headline
  const isFullWidthShowcase = !isMobile && 
                              layout?.imagePosition === 'center' && 
                              layout?.textAlignment === 'center' &&
                              category.subheadline && 
                              category.headline;

  // Calculate style classes based on layout
  const containerClasses = isMobile
    ? `flex ${layout?.imagePosition === 'bottom' ? 'flex-col-reverse' : 'flex-col'}`
    : isFullWidthShowcase 
      ? 'flex flex-col'
      : `grid ${layout?.imagePosition === 'left' ? 'grid-cols-2' : layout?.imagePosition === 'right' ? 'grid-cols-2' : 'grid-cols-1'}`;
  
  const textClasses = `flex flex-col ${layout?.textAlignment === 'left' ? 'items-start text-left' : layout?.textAlignment === 'right' ? 'items-end text-right' : 'items-center text-center'}`;

  const textContainerClasses = isFullWidthShowcase
    ? 'py-4 px-6 w-full'
    : isMobile
      ? 'p-4 w-full'
      : layout?.imagePosition === 'center' && !isFullWidthShowcase
        ? 'absolute inset-0 flex items-center justify-center z-10'
        : layout?.imagePosition === 'left'
          ? 'p-6 flex items-center order-last'
          : 'p-6 flex items-center';

  return (
    <div className="category-preview rounded-lg overflow-hidden relative">
      {isFullWidthShowcase && (
        <div className="w-full py-4 flex flex-col items-center justify-center">
          {category.subheadline && (
            <p className="text-sm md:text-base uppercase tracking-wide" style={{ color: '#000' }}>
              {category.subheadline}
            </p>
          )}
          {category.headline && (
            <h2 className="text-xl md:text-4xl font-bold mt-2 mb-4" style={{ color: '#000' }}>
              {category.headline}
            </h2>
          )}
        </div>
      )}

      <div className={containerClasses}>
        {/* Image Section */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          {images.length > 0 ? (
            <div className="relative h-full w-full">
              <Image
                src={images[currentImageIndex]}
                alt={category.name}
                fill
                className="object-cover transition-opacity duration-500"
                unoptimized={true}
              />
              {/* Overlay */}
              {category.customStyles?.backgroundColor && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: category.customStyles.backgroundColor,
                    opacity: category.customStyles.overlayOpacity / 100,
                  }}
                ></div>
              )}
              
              {/* Image Navigation Dots */}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400 bg-opacity-50'}`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
        
        {/* Text Content - only shown if not using the full-width showcase layout */}
        {!isFullWidthShowcase && (
          <div className={textContainerClasses}>
            <div className={textClasses}>
              {category.subheadline && !isFullWidthShowcase && (
                <p
                  className="text-sm md:text-base mb-1"
                  style={{ color: category.customStyles?.textColor || '#000000' }}
                >
                  {category.subheadline}
                </p>
              )}
              
              {category.headline && !isFullWidthShowcase && (
                <h2
                  className="text-xl md:text-3xl font-bold mb-2 md:mb-3"
                  style={{ color: category.customStyles?.textColor || '#000000' }}
                >
                  {category.headline}
                </h2>
              )}
              
              {description && (
                <p
                  className="text-sm md:text-base mb-4 max-w-md"
                  style={{ color: category.customStyles?.textColor || '#000000' }}
                >
                  {description}
                </p>
              )}
              
              {category.callToAction && (
                <Link
                  href={category.callToAction.link || `/categories/${category._id}`}
                  className="px-5 py-2 border text-sm font-medium rounded transition-colors hover:bg-white hover:bg-opacity-10"
                  style={{
                    color: category.customStyles?.textColor || '#000000',
                    borderColor: category.customStyles?.textColor || '#000000',
                  }}
                >
                  {category.callToAction.text || 'EXPLORE'}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call to action button for full-width showcase layout */}
      {isFullWidthShowcase && category.callToAction && (
        <div className="w-full flex justify-center pb-6">
          <Link
            href={category.callToAction.link || `/categories/${category._id}`}
            className="px-8 py-2 border text-sm font-medium rounded transition-colors hover:bg-black hover:text-white hover:border-black"
            style={{ borderColor: '#000000', color: '#000000' }}
          >
            {category.callToAction.text || 'EXPLORE'}
          </Link>
        </div>
      )}
      
      {/* Status Indicator */}
      <div className="flex justify-center py-2">
        <div className={`px-3 py-1 text-xs font-medium rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
    </div>
  );
} 