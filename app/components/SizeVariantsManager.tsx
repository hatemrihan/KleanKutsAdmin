'use client';

import { useState } from 'react';
import { SizeVariant, ColorVariant } from '../types/product';

interface SizeVariantsManagerProps {
  sizeVariants: SizeVariant[];
  onChange: (variants: SizeVariant[]) => void;
  availableSizes: string[];
}

// Function to convert color names to hex values for visual display
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'red': '#f44336',
    'blue': '#2196f3',
    'green': '#4caf50',
    'yellow': '#ffeb3b',
    'purple': '#9c27b0',
    'pink': '#e91e63',
    'orange': '#ff9800',
    'brown': '#795548',
    'grey': '#9e9e9e',
    'black': '#000000',
    'white': '#ffffff',
  };

  // Convert to lowercase for case-insensitive matching
  const normalizedColor = colorName.toLowerCase();
  
  // Check if the color name exists in our map
  if (normalizedColor in colorMap) {
    return colorMap[normalizedColor];
  }
  
  // For colors not in our map, return a default color
  return '#cccccc';
};

export default function SizeVariantsManager({ 
  sizeVariants = [], 
  onChange, 
  availableSizes 
}: SizeVariantsManagerProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [colorInput, setColorInput] = useState<string>('');
  const [stockInput, setStockInput] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Get sizes that have already been added to sizeVariants
  const addedSizes = sizeVariants.map(v => v.size);
  
  // Available sizes for dropdown should exclude already added sizes
  const availableSizesForDropdown = availableSizes.filter(size => !addedSizes.includes(size));

  // Add a new size variant
  const addSizeVariant = () => {
    if (!selectedSize) {
      setError('Please select a size');
      return;
    }

    // Check if size already exists
    if (addedSizes.includes(selectedSize)) {
      setError('This size has already been added');
      return;
    }

    const newVariant: SizeVariant = {
      size: selectedSize,
      colorVariants: []
    };

    const newVariants = [...sizeVariants, newVariant];
    onChange(newVariants);
    setSelectedSize('');
    setError('');
  };

  // Remove a size variant
  const removeSizeVariant = (sizeToRemove: string) => {
    const newVariants = sizeVariants.filter(variant => variant.size !== sizeToRemove);
    onChange(newVariants);
  };

  // Add a color variant to a size
  const addColorVariant = (sizeIndex: number) => {
    if (!colorInput.trim()) {
      setError('Please enter a color name');
      return;
    }

    if (stockInput < 0) {
      setError('Stock cannot be negative');
      return;
    }

    const currentSize = sizeVariants[sizeIndex];
    
    // Check if color already exists for this size
    if (currentSize.colorVariants.some(cv => cv.color.toLowerCase() === colorInput.toLowerCase())) {
      setError(`Color "${colorInput}" already exists for size ${currentSize.size}`);
      return;
    }

    const newColorVariant: ColorVariant = {
      color: colorInput,
      stock: stockInput
    };

    const updatedVariants = [...sizeVariants];
    updatedVariants[sizeIndex] = {
      ...currentSize,
      colorVariants: [...currentSize.colorVariants, newColorVariant]
    };

    onChange(updatedVariants);
    setColorInput('');
    setStockInput(0);
    setError('');
  };

  // Remove a color variant from a size
  const removeColorVariant = (sizeIndex: number, colorIndex: number) => {
    const currentSize = sizeVariants[sizeIndex];
    const updatedColorVariants = currentSize.colorVariants.filter((_, index) => index !== colorIndex);
    
    const updatedVariants = [...sizeVariants];
    updatedVariants[sizeIndex] = {
      ...currentSize,
      colorVariants: updatedColorVariants
    };

    onChange(updatedVariants);
  };

  // Update stock for a specific color variant
  const updateStock = (sizeIndex: number, colorIndex: number, newStock: number) => {
    if (newStock < 0) return;

    const updatedVariants = [...sizeVariants];
    updatedVariants[sizeIndex].colorVariants[colorIndex].stock = newStock;
    
    onChange(updatedVariants);
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="mb-4 p-3 text-red-600 bg-red-100 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Add new size section */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
        <h3 className="text-md font-medium mb-3 text-gray-700">Add New Size</h3>
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="">Select size...</option>
              {availableSizesForDropdown.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addSizeVariant}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            disabled={!selectedSize}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Size
          </button>
        </div>
      </div>

      {/* List of size variants */}
      {sizeVariants.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 italic">No size variants added yet. Add sizes above.</p>
        </div>
      ) : (
        sizeVariants.map((sizeVariant, sizeIndex) => (
          <div 
            key={sizeVariant.size} 
            className="border border-gray-200 rounded-lg p-5 mb-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-lg font-semibold text-green-700 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">{sizeVariant.size}</span>
                <span>Size Variant</span>
              </h3>
              <button
                type="button"
                onClick={() => removeSizeVariant(sizeVariant.size)}
                className="text-red-500 hover:text-red-700 flex items-center px-3 py-1 rounded-md hover:bg-red-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Remove Size
              </button>
            </div>

            {/* Add color variant section */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Color Variant</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="e.g., Red, Blue, Green"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => addColorVariant(sizeIndex)}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center"
                    disabled={!colorInput.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* List of color variants */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Color Variants for {sizeVariant.size}</h4>
              {sizeVariant.colorVariants.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p className="text-gray-500 italic text-sm">No color variants added yet for this size.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Color
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock (EGY L.E.)
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sizeVariant.colorVariants.map((colorVariant, colorIndex) => (
                        <tr key={`${sizeVariant.size}-${colorVariant.color}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: getColorHex(colorVariant.color) }}></div>
                              <span className="text-sm font-medium text-gray-900">{colorVariant.color}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={colorVariant.stock}
                                onChange={(e) => updateStock(sizeIndex, colorIndex, parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                              />
                              <span className="ml-2 text-sm text-gray-500">units</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeColorVariant(sizeIndex, colorIndex)}
                              className="text-red-500 hover:text-red-700 flex items-center justify-end gap-1 hover:bg-red-50 px-2 py-1 rounded-md ml-auto"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
