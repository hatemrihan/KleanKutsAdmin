/**
 * Utilities for image handling and optimization with Cloudinary
 */

/**
 * Optimizes a Cloudinary URL with transformation parameters
 * 
 * @param url The original Cloudinary URL
 * @param width The desired width of the image
 * @param quality The desired quality (1-100)
 * @param format The desired format (jpg, png, webp, etc)
 * @returns Optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (
  url: string,
  width: number = 800,
  quality: number = 80,
  format: string = 'auto'
): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Extract the base URL and version/id segments
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }

  // Build the optimized URL with transformations
  return `${urlParts[0]}/upload/w_${width},q_${quality},f_${format}/${urlParts[1]}`;
};

/**
 * Process a product image URL to ensure it's properly formatted
 * 
 * @param imageUrl The image URL to process
 * @returns Processed image URL
 */
export const processProductImage = (imageUrl: string): string => {
  // If not a Cloudinary URL, convert it
  if (imageUrl && !imageUrl.includes('cloudinary.com')) {
    // Convert to proper Cloudinary URL
    const imageName = imageUrl.split('/').pop() || '';
    return `https://res.cloudinary.com/dvcs7czio/image/upload/v1/products/${imageName}`;
  }
  return imageUrl;
};

/**
 * Process a category image URL to ensure it's properly formatted
 * 
 * @param imageUrl The category image URL to process
 * @returns Processed category image URL
 */
export const processCategoryImage = (imageUrl: string): string => {
  // If not a Cloudinary URL, convert it
  if (imageUrl && !imageUrl.includes('cloudinary.com')) {
    // Convert to proper Cloudinary URL using the same logic as product images
    const imageName = imageUrl.split('/').pop() || '';
    return `https://res.cloudinary.com/dvcs7czio/image/upload/v1/categories/${imageName}`;
  }
  return imageUrl;
};

/**
 * General function to generate a thumbnail version of an image URL
 * 
 * @param imageUrl The original image URL
 * @param width The desired thumbnail width
 * @returns Thumbnail image URL
 */
export const generateThumbnail = (imageUrl: string, width: number = 100): string => {
  return optimizeCloudinaryUrl(imageUrl, width, 70, 'auto');
};

/**
 * Convert a file object to a base64 string for preview purposes
 * 
 * @param file The file object to convert
 * @returns Promise with the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}; 