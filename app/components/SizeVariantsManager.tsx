'use client';

import { useState, useEffect } from 'react';
import { SizeVariant, ColorVariant } from '../types/product';

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

  return (
    <div className="mb-6">
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

      {/* Add new size section - Enhanced and more compact */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
        <h3 className="text-md font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Size
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-grow w-full sm:w-auto">
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
              Select Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
            >
              <option value="">Choose a size...</option>
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
            className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 flex items-center justify-center transition-colors"
            disabled={!selectedSize}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Size
          </button>
        </div>
      </div>

      {/* Enhanced responsive layout - Stack on mobile, side-by-side on larger screens */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 mb-6">
        {/* Size tabs - Better mobile layout */}
        <div className="lg:col-span-3">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/30">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
                Available Sizes ({sizeVariants.length})
              </h3>
            </div>
            <div className="p-3">
              {sizeVariants.length === 0 ? (
                <div className="text-center py-6 px-3">
                  <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No sizes added yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add a size above to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sizeVariants.map((variant, index) => (
                    <button
                      key={variant.size}
                      onClick={() => setActiveSize(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${activeSizeIndex === index 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 shadow-sm' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${activeSizeIndex === index 
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}>
                            {variant.size}
                          </span>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <div>{variant.colorVariants?.length || 0} colors</div>
                            <div className="text-gray-500 dark:text-gray-500">
                              {(variant.colorVariants || []).reduce((sum, cv) => sum + cv.stock, 0)} units
                            </div>
                          </div>
                        </div>
                        {activeSizeIndex === index && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Color variants management - Improved responsive design */}
        <div className="lg:col-span-9">
          {sizeVariants.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sizes yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Add a size first to manage color variants</p>
            </div>
          ) : activeSizeIndex !== null && sizeVariants[activeSizeIndex] ? (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-black/30">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm mr-3">
                    {sizeVariants[activeSizeIndex].size}
                  </span>
                  <span>Size Variant</span>
                </h3>
                <button
                  type="button"
                  onClick={() => removeSizeVariant(sizeVariants[activeSizeIndex].size)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Remove Size
                </button>
              </div>

              <div className="p-4">
                {/* Color selection section - Enhanced design */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-black/30 dark:to-blue-900/10 p-4 rounded-lg border border-gray-200 dark:border-gray-800 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zM3 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1zm6-11a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V4zm-9 3a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1V7zm6 0a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1h-4a1 1 0 01-1-1V7zm6 0a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1V7zm-9 3a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-1zm6 0a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 01-1 1h-4a1 1 0 01-1-1v-1z" clipRule="evenodd" />
                    </svg>
                    Add New Color Variant
                  </h4>
                  
                  {/* Common colors selection - Better mobile layout */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-3">
                      Quick Color Selection
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-10 gap-2">
                      {COMMON_COLORS.map(color => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => selectPredefinedColor(color.name)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${colorInput === color.name ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800 scale-110' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'}`}
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
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${customColorMode ? 'border-blue-500 bg-gray-100 dark:bg-gray-900 scale-110' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-black hover:border-gray-400'}`}
                        title="Custom color"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
                    <div className="sm:col-span-1 lg:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
                        Color Name
                      </label>
                      <div className="flex items-center">
                        {!customColorMode && colorInput && (
                          <div 
                            className="w-6 h-6 rounded-full mr-2 border border-gray-300 dark:border-gray-600" 
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
                    <div className="sm:col-span-1 lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={stockInput}
                        onChange={(e) => setStockInput(parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <button
                        type="button"
                        onClick={() => addColorVariant(activeSizeIndex)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-colors"
                        disabled={!colorInput.trim()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced table design with better mobile responsiveness */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                    Color Variants for {sizeVariants[activeSizeIndex].size}
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs">
                      {sizeVariants[activeSizeIndex].colorVariants?.length || 0}
                    </span>
                  </h4>
                  {!sizeVariants[activeSizeIndex].colorVariants || sizeVariants[activeSizeIndex].colorVariants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30">
                      <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No color variants yet</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Add colors using the form above</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                      {/* Mobile-friendly table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                          <thead className="bg-gray-50 dark:bg-black/30">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Color
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                Stock Quantity
                              </th>
                              <th scope="col" className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
                            {sizeVariants[activeSizeIndex].colorVariants.map((colorVariant, colorIndex) => (
                              <tr key={`${sizeVariants[activeSizeIndex].size}-${colorVariant.color}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full mr-3 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: getColorHex(colorVariant.color) }}></div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{colorVariant.color}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <input
                                      type="number"
                                      value={colorVariant.stock}
                                      onChange={(e) => updateStock(activeSizeIndex, colorIndex, parseInt(e.target.value) || 0)}
                                      min="0"
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                                    />
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">units</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => removeColorVariant(activeSizeIndex, colorIndex)}
                                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center justify-end gap-1 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-md ml-auto transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden lg:inline">Remove</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile card layout */}
                      <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-800">
                        {sizeVariants[activeSizeIndex].colorVariants.map((colorVariant, colorIndex) => (
                          <div key={`${sizeVariants[activeSizeIndex].size}-${colorVariant.color}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full mr-3 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: getColorHex(colorVariant.color) }}></div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{colorVariant.color}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeColorVariant(activeSizeIndex, colorIndex)}
                                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Stock:</label>
                              <input
                                type="number"
                                value={colorVariant.stock}
                                onChange={(e) => updateStock(activeSizeIndex, colorIndex, parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-black dark:text-white"
                              />
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">units</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/30">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Select a size to manage its color variants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}