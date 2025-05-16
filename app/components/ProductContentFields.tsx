import React from 'react';

interface ProductContentFieldsProps {
  materials: string[];
  sizeGuide: string;
  packaging: string;
  shippingReturns: string;
  onChange: (field: string, value: string | string[]) => void;
}

export default function ProductContentFields({
  materials,
  sizeGuide,
  packaging,
  shippingReturns,
  onChange
}: ProductContentFieldsProps) {
  // Handle adding a new material
  const handleAddMaterial = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = event.currentTarget.value.trim();
      if (value && !materials.includes(value)) {
        onChange('materials', [...materials, value]);
        event.currentTarget.value = '';
      }
    }
  };

  // Handle removing a material
  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials.splice(index, 1);
    onChange('materials', updatedMaterials);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Admin-Only Product Content</h2>
      <p className="text-sm text-gray-500 mb-4">
        These fields are only visible to admins and can be used to set standardized content that will be displayed on the product page.
      </p>
      
      {/* Materials Section */}
      <div>
        <label className="block text-sm font-medium mb-2">Materials</label>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Type a material and press Enter"
            className="px-3 py-2 border rounded-md w-full"
            onKeyDown={handleAddMaterial}
          />
        </div>
        
        {materials.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {materials.map((material, index) => (
              <div 
                key={index} 
                className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
              >
                <span>{material}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveMaterial(index)}
                  className="text-gray-500 hover:text-red-500"
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
        <label className="block text-sm font-medium mb-2">Size Guide</label>
        <textarea
          value={sizeGuide}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('sizeGuide', e.target.value)}
          placeholder="Enter size guide information here..."
          className="px-3 py-2 border rounded-md w-full min-h-[120px]"
        />
      </div>
      
      {/* Packaging */}
      <div>
        <label className="block text-sm font-medium mb-2">Packaging</label>
        <textarea
          value={packaging}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('packaging', e.target.value)}
          placeholder="Enter packaging details here..."
          className="px-3 py-2 border rounded-md w-full min-h-[100px]"
        />
      </div>
      
      {/* Shipping & Returns */}
      <div>
        <label className="block text-sm font-medium mb-2">Shipping & Returns</label>
        <textarea
          value={shippingReturns}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('shippingReturns', e.target.value)}
          placeholder="Enter shipping and returns policy here..."
          className="px-3 py-2 border rounded-md w-full min-h-[120px]"
        />
      </div>
    </div>
  );
} 