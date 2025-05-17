import React from 'react';
import { useRouter } from 'next/navigation';

interface ProductContentFieldsProps {
  materials: string[];
  sizeGuide: string;
  packaging: string;
  shippingReturns: string;
  onChange: (field: string, value: string | string[]) => void;
}

export default function ProductContentFields({
  materials = [],
  sizeGuide,
  packaging,
  shippingReturns,
  onChange
}: ProductContentFieldsProps) {
  const router = useRouter();
  const materialsList = Array.isArray(materials) ? materials : [];

  // Handle adding a new material
  const handleAddMaterial = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = event.currentTarget.value.trim();
      if (value && !materialsList.includes(value)) {
        onChange('materials', [...materialsList, value]);
        event.currentTarget.value = '';
      }
    }
  };

  // Handle removing a material
  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...materialsList];
    updatedMaterials.splice(index, 1);
    onChange('materials', updatedMaterials);
  };

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
        
        {/* Materials Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">Materials</label>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Type a material and press Enter"
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full bg-white dark:bg-black dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={handleAddMaterial}
            />
          </div>
          
          {materialsList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {materialsList.map((material, index) => (
                <div 
                  key={index} 
                  className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span className="text-gray-800 dark:text-white">{material}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
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