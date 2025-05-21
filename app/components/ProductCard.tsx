'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { calculateTotalStock } from '../utils/stockCalculator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  selectedImages: string[];
  categories?: string[];
  sizeVariants?: Array<{
    size: string;
    colorVariants: Array<{
      color: string;
      stock: number;
    }>;
  }>;
}

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, onEdit }) => {
  const totalStock = calculateTotalStock(product);
  
  // Default image if none provided
  const imageUrl = product.selectedImages?.[0] || '/placeholder-product.jpg';
  
  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden transition-shadow border border-gray-200 dark:border-gray-800 hover:shadow-md">
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src={imageUrl}
            alt={product.title}
            layout="fill"
            objectFit="cover"
            className="transition-opacity duration-300"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
            }}
          />
          {product.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              {product.discount}% OFF
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white line-clamp-1">{product.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">{product.description}</p>
        
        <div className="mt-2 flex justify-between items-center">
          <div>
            <div className="text-sm sm:text-base font-medium text-black dark:text-white">{product.price.toLocaleString()} L.E.</div>
          </div>
          <div>
            {totalStock > 10 ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                In Stock
              </span>
            ) : totalStock > 0 ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                Low Stock
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                Out of Stock
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <Link 
            href={`/products/${product._id}`}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            Edit
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-red-600 dark:text-red-400 text-sm hover:underline">
                Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="dark:bg-black dark:border-gray-800 max-w-md mx-auto">
              <AlertDialogHeader>
                <AlertDialogTitle className="dark:text-white">Delete Product</AlertDialogTitle>
                <AlertDialogDescription className="dark:text-gray-400">
                  Are you sure you want to delete this product? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel className="dark:bg-black dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(product._id)} 
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 sm:w-auto"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 