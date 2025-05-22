import React from 'react';
import { useRouter } from 'next/navigation';

interface ProductContentFieldsProps {
  sizeGuide: string;
  packaging: string;
  shippingReturns: string;
  onChange: (field: string, value: string | string[]) => void;
}

export default function ProductContentFields({
  sizeGuide,
  packaging,
  shippingReturns,
  onChange
}: ProductContentFieldsProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* GET BACK button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          GET BACK
        </button>
      </div>

      <div className="bg-white dark:bg-black p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Admin-Only Product Content</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          These fields are only visible to admins and can be used to set standardized content that will be displayed on the product page.
        </p>
        
        {/* Size Guide */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Size Guide</label>
          <textarea
            value={sizeGuide}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('sizeGuide', e.target.value)}
            placeholder="Enter size guide information here..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full min-h-[120px] bg-white dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Packaging */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Packaging</label>
          <textarea
            value={packaging}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('packaging', e.target.value)}
            placeholder="Enter packaging details here..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full min-h-[100px] bg-white dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Shipping & Returns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Shipping & Returns</label>
          <textarea
            value={shippingReturns}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('shippingReturns', e.target.value)}
            placeholder="Enter shipping and returns policy here..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full min-h-[120px] bg-white dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
} 