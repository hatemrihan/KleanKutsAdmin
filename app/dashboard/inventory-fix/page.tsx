'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { config } from '../../../config';

export default function InventoryFixPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFixInventory = async () => {
    if (!orderId) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Direct API call to our manual update endpoint
      const response = await axios.post('/api/inventory/manual-update', {
        orderId,
        forceUpdate: true
      });

      console.log('Inventory update response:', response.data);
      setResult(response.data);

      if (response.data.success) {
        toast.success(`Successfully updated inventory for order ${orderId}`);
      } else {
        toast.error(`Failed to update inventory: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast.error(`Error: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      setResult({ error: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Fix Utility</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Manual Inventory Update</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Use this tool to manually update inventory for a specific order when automatic updates have failed.
        </p>
        
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Enter order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleFixInventory}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Update Inventory'}
          </Button>
        </div>

        <div className="text-sm">
          <p>Example: 682810585580e68a7a1e87a8</p>
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          
          {result.success ? (
            <div className="text-green-600 dark:text-green-400">
              <p className="font-medium">Success!</p>
              <p>Updated {result.updatedProducts?.length || 0} product(s).</p>
              
              {result.updatedProducts && result.updatedProducts.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Updated Products:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.updatedProducts.map((item: any, index: number) => (
                      <li key={index}>
                        Product: {item.productId}, Size: {item.size}, Color: {item.color}, 
                        Stock change: {item.previousQuantity} → {item.newQuantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 dark:text-red-400">
              <p className="font-medium">Error!</p>
              <p>{result.error}</p>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Errors:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.errors.map((error: any, index: number) => (
                      <li key={index}>{JSON.stringify(error)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 