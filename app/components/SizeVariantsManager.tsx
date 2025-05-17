'use client';

import { useState, useEffect } from 'react';
import { SizeVariant, ColorVariant } from '../types/product';
import { useRouter } from 'next/navigation';

interface SizeVariantsManagerProps {
  sizeVariants: SizeVariant[];
  onChange: (variants: SizeVariant[]) => void;
  availableSizes: string[];
}

// Common colors with their hex values for visual display
const COMMON_COLORS = [
  { name: 'Red', hex: '#f44336' },
  { name: 'Blue', hex: '#2196f3' },
  { name: 'Green', hex: '#4caf50' },
  { name: 'Yellow', hex: '#ffeb3b' },
  { name: 'Purple', hex: '#9c27b0' },
  { name: 'Pink', hex: '#e91e63' },
  { name: 'Orange', hex: '#ff9800' },
  { name: 'Brown', hex: '#795548' },
  { name: 'Grey', hex: '#9e9e9e' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Beige', hex: '#f5f5dc' },
  { name: 'Mint', hex: '#98ff98' },
  { name: 'Gold', hex: '#ffd700' },
  { name: 'Silver', hex: '#c0c0c0' },
];

// Function to convert color names to hex values for visual display
const getColorHex = (colorName: string): string => {
  // Convert to lowercase for case-insensitive matching
  const normalizedColor = colorName.toLowerCase();
  
  // Check if the color name exists in our map
  const foundColor = COMMON_COLORS.find(c => c.name.toLowerCase() === normalizedColor);
  if (foundColor) {
    return foundColor.hex;
  }
  
  // For colors not in our map, return a default color
  return '#cccccc';
};

export default function SizeVariantsManager({ 
  sizeVariants = [], 
  onChange, 
  availableSizes 
}: SizeVariantsManagerProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeSizeIndex, setActiveSizeIndex] = useState<number | null>(null);
  const [colorInput, setColorInput] = useState<string>('');
  const [stockInput, setStockInput] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customColorMode, setCustomColorMode] = useState<boolean>(false);

  // Get sizes that have already been added to sizeVariants
  const addedSizes = sizeVariants.map(v => v.size);
  
  // Available sizes for dropdown should exclude already added sizes
  const availableSizesForDropdown = availableSizes.filter(size => !addedSizes.includes(size));
  
  // Reset color input when active size changes
  useEffect(() => {
    setColorInput('');
    setStockInput(0);
    setError('');
    setShowColorPicker(false);
  }, [activeSizeIndex]);
  
  // Set the first size as active when component loads if there are sizes
  useEffect(() => {
    if (sizeVariants.length > 0 && activeSizeIndex === null) {
      setActiveSizeIndex(0);
    } else if (sizeVariants.length === 0) {
      setActiveSizeIndex(null);
    }
  }, [sizeVariants.length, activeSizeIndex]);

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
    
    // Set the newly added size as active
    setActiveSizeIndex(newVariants.length - 1);
    setSelectedSize('');
    setError('');
    setShowColorPicker(true); // Show color picker for the new size
  };

  // Remove a size variant
  const removeSizeVariant = (sizeToRemove: string) => {
    const newVariants = sizeVariants.filter(variant => variant.size !== sizeToRemove);
    onChange(newVariants);
    
    // Reset active size if the active one was removed
    if (newVariants.length > 0) {
      setActiveSizeIndex(0);
    } else {
      setActiveSizeIndex(null);
    }
  };
  
  // Select a predefined color
  const selectPredefinedColor = (colorName: string) => {
    setColorInput(colorName);
    setCustomColorMode(false);
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
    
    // Initialize colorVariants if it doesn't exist
    if (!currentSize.colorVariants) {
      const updatedVariants = [...sizeVariants];
      updatedVariants[sizeIndex] = {
        ...currentSize,
        colorVariants: []
      };
      onChange(updatedVariants);
      currentSize.colorVariants = [];
    }
    
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
    setShowColorPicker(false);
  };

  // Remove a color variant from a size
  const removeColorVariant = (sizeIndex: number, colorIndex: number) => {
    const currentSize = sizeVariants[sizeIndex];
    
    // Check if colorVariants exists
    if (!currentSize.colorVariants) return;
    
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

    // Check if the size variant and color variant exist
    if (!sizeVariants[sizeIndex]?.colorVariants?.[colorIndex]) return;

    const updatedVariants = [...sizeVariants];
    updatedVariants[sizeIndex].colorVariants[colorIndex].stock = newStock;
    
    onChange(updatedVariants);
  };
  
  // Set a size as active for editing
  const setActiveSize = (index: number) => {
    setActiveSizeIndex(index);
    setShowColorPicker(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="mb-6">
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

      {error && (
        <div className="mb-4 p-3 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError('')}
            className="text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add new size section */}
      <div className="p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg mb-6">
        <h3 className="text-md font-medium mb-3 text-gray-700 dark:text-white">Add New Size</h3>
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
              Select Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            disabled={!selectedSize}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Size
          </button>
        </div>
      </div>

      {/* Size variants management section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Size tabs on the left */}
        <div className="md:col-span-1 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/30">
            <h3 className="font-medium text-gray-700 dark:text-white">Available Sizes</h3>
          </div>
          <div className="p-2">
            {sizeVariants.length === 0 ? (
              <div className="text-center py-4 px-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">No sizes added yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sizeVariants.map((variant, index) => (
                  <button
                    key={variant.size}
                    onClick={() => setActiveSize(index)}
                    className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${activeSizeIndex === index ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                  >
                    <span className="flex items-center">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs mr-2">
                        {variant.size}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {variant.colorVariants?.length || 0} {(variant.colorVariants?.length || 0) === 1 ? 'color' : 'colors'}
                      </span>
                    </span>
                    {activeSizeIndex === index && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Color variants management on the right */}
        <div className="md:col-span-3">
          {sizeVariants.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30 h-full flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 italic">Add a size first to manage color variants</p>
            </div>
          ) : activeSizeIndex !== null && sizeVariants[activeSizeIndex] ? (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-black shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-800">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm mr-2">
                    {sizeVariants[activeSizeIndex].size}
                  </span>
                  <span>Size Variant</span>
                </h3>
                <button
                  type="button"
                  onClick={() => removeSizeVariant(sizeVariants[activeSizeIndex].size)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Remove Size
                </button>
              </div>

              {/* Color selection section */}
              <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-md border border-gray-200 dark:border-gray-800 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-3">Add New Color Variant</h4>
                
                {/* Common colors selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    Select a Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_COLORS.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => selectPredefinedColor(color.name)}
                        className={`w-8 h-8 rounded-full border-2 ${colorInput === color.name ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800' : 'border-gray-300 dark:border-gray-700'}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomColorMode(true);
                        setColorInput('');
                      }}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${customColorMode ? 'border-blue-500 bg-gray-100 dark:bg-gray-900' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black'}`}
                      title="Custom color"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
                      Color Name
                    </label>
                    <div className="flex items-center">
                      {!customColorMode && colorInput && (
                        <div 
                          className="w-6 h-6 rounded-full mr-2" 
                          style={{ backgroundColor: getColorHex(colorInput) }}
                        />
                      )}
                      <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder={customColorMode ? "Enter custom color name" : "Select a color or enter name"}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={stockInput}
                      onChange={(e) => setStockInput(parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => addColorVariant(activeSizeIndex)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
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
                <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-3">Color Variants for {sizeVariants[activeSizeIndex].size}</h4>
                {!sizeVariants[activeSizeIndex].colorVariants || sizeVariants[activeSizeIndex].colorVariants.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 italic text-sm">No color variants added yet for this size.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-black/30">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Color
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Stock (Units)
                          </th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
                        {sizeVariants[activeSizeIndex].colorVariants.map((colorVariant, colorIndex) => (
                          <tr key={`${sizeVariants[activeSizeIndex].size}-${colorVariant.color}`} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: getColorHex(colorVariant.color) }}></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{colorVariant.color}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  value={colorVariant.stock}
                                  onChange={(e) => updateStock(activeSizeIndex, colorIndex, parseInt(e.target.value) || 0)}
                                  min="0"
                                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                                />
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">units</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => removeColorVariant(activeSizeIndex, colorIndex)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center justify-end gap-1 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-md ml-auto"
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
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30">
              <p className="text-gray-500 dark:text-gray-400 italic">Select a size to manage its color variants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}