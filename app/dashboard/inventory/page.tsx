'use client';

import { useState, useEffect } from 'react';
import Nav from '../../sections/nav';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface ProductInventory {
  id: string;
  title: string;
  totalStock: number;
  bySizeStock: Record<string, {
    total: number;
    byColor: Record<string, number>;
  }>;
}

export default function InventoryPage() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [testProductId, setTestProductId] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch inventory data on page load
  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setInventoryLoading(true);
      const response = await axios.get('/api/inventory/sync');
      
      if (response.data && response.data.summary) {
        setInventory(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const syncAllInventory = async () => {
    try {
      setError(null);
      setSyncLoading(true);
      
      // Call the sync endpoint
      const response = await fetch('/api/inventory/sync-all-orders');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to synchronize inventory');
      }
      
      const data = await response.json();
      setSyncResults(data);
      
      // Show success message
      if (data.products?.updated > 0) {
        toast.success(`Updated inventory for ${data.products.updated} products across ${data.orders?.needingUpdates || 0} orders`);
      } else {
        toast.success('All inventory is already up-to-date');
      }
      
      // Fetch the latest inventory data to show real data
      await fetchInventoryData();
    } catch (error: any) {
      console.error('Error syncing inventory:', error);
      setError(error.message || 'Failed to synchronize inventory');
      toast.error('Failed to synchronize inventory');
    } finally {
      setSyncLoading(false);
    }
  };

  // Test inventory reduction for a specific product
  const testInventoryReduction = async (productId: string) => {
    try {
      setTestLoading(true);
      setTestProductId(productId);
      setTestResult(null);
      
      const response = await axios.post('/api/inventory/test-reduction', {
        productId,
        quantity: 1
      });
      
      if (response.data) {
        setTestResult(response.data);
        toast.success(`Tested inventory reduction for ${response.data.product.title}`);
        // Refresh inventory data
        await fetchInventoryData();
      }
    } catch (error) {
      console.error('Error testing inventory reduction:', error);
      toast.error('Failed to test inventory reduction');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inventory Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="dark:bg-black dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Inventory Synchronization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  This tool ensures that your inventory is properly updated when orders are processed.
                  Run this if you notice any discrepancies between actual stock and what&apos;s shown in the system.
                </p>
                
                <Button 
                  onClick={syncAllInventory} 
                  disabled={syncLoading}
                  className="w-full dark:bg-white dark:text-black hover:dark:bg-gray-200"
                >
                  {syncLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Synchronizing Inventory...
                    </>
                  ) : 'Synchronize All Inventory'}
                </Button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 dark:bg-black dark:border dark:border-red-800 dark:text-red-400 rounded-md">
                    {error}
                  </div>
                )}
                
                {syncResults && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-black dark:border dark:border-gray-800 rounded-md">
                    <h3 className="text-lg font-medium mb-2 dark:text-white">Synchronization Results</h3>
                    <ul className="space-y-2 dark:text-gray-300">
                      <li>Orders scanned: <span className="font-medium dark:text-white">{syncResults.orders?.total || 0}</span></li>
                      <li>Orders needing updates: <span className="font-medium dark:text-white">{syncResults.orders?.needingUpdates || 0}</span></li>
                      <li>Products needing updates: <span className="font-medium dark:text-white">{syncResults.products?.needingUpdates || 0}</span></li>
                      <li>Products successfully updated: <span className="font-medium dark:text-white">{syncResults.products?.updated || 0}</span></li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="dark:bg-black dark:border-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Inventory Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 list-disc pl-5 dark:text-gray-300">
                  <li>Inventory is automatically reduced when an order is marked as <strong className="dark:text-white">Processing</strong>.</li>
                  <li>You can manually synchronize inventory using the button on the left.</li>
                  <li>Always check inventory levels after bulk order processing.</li>
                  <li>When adding new products, make sure to set accurate initial inventory levels.</li>
                  <li>If products show as out of stock incorrectly, use the sync tool to fix the issue.</li>
                  <li>Inventory is synchronized between the admin panel and e-commerce site automatically.</li>
                  <li>Use the Test Reduction button to verify inventory changes when orders are processed.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Real-time Inventory Display */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-xl font-semibold dark:text-white">Current Inventory</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchInventoryData}
                disabled={inventoryLoading}
                className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
              >
                {inventoryLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Refreshing...
                  </>
                ) : 'Refresh'}
              </Button>
            </div>
            
            {inventoryLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-white" />
              </div>
            ) : inventory.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Stock</th>
                      <th className="px-4 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      <th className="px-4 py-3 bg-gray-50 dark:bg-black text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Variants</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
                    {inventory.map((product, index) => (
                      <tr key={product.id} className={index % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="break-words max-w-[150px] sm:max-w-none">{product.title}</div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`font-medium ${product.totalStock > 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                            {product.totalStock} units
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testInventoryReduction(product.id)}
                            disabled={testLoading && testProductId === product.id}
                            className="dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900"
                          >
                            {testLoading && testProductId === product.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Testing...
                              </>
                            ) : 'Test Reduction'}
                          </Button>
                          
                          {testResult && testResult.product.id === product.id && (
                            <div className="mt-2 text-xs p-2 bg-blue-50 dark:bg-gray-900 dark:border dark:border-gray-700 rounded">
                              <p className="dark:text-white">Reduced by: <span className="font-medium">{testResult.variant.reduced}</span> units</p>
                              <p className="dark:text-white">Before: {testResult.variant.quantityBefore} → After: {testResult.variant.quantityAfter}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="space-y-2">
                            {Object.entries(product.bySizeStock).map(([size, sizeData]) => (
                              <div key={size} className="bg-gray-50 dark:bg-gray-900 rounded-md p-2">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium dark:text-white">Size {size}:</span>
                                  <span className="font-medium dark:text-white">{sizeData.total} units</span>
                                </div>
                                <div className="pl-4 text-xs space-y-1">
                                  {Object.entries(sizeData.byColor).map(([color, count]) => (
                                    <div key={color} className="flex justify-between">
                                      <span className="dark:text-gray-300">{color || 'Default'}:</span>
                                      <span className={count === 0 ? 'text-red-500 dark:text-red-400 font-medium' : 'dark:text-white'}>{count} units</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p>No inventory data available. Click Synchronize to update inventory.</p>
              </div>
            )}
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Inventory FAQ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium dark:text-white">How is inventory calculated?</h3>
                <p className="text-gray-600 dark:text-gray-300">Inventory is tracked by individual product variants (size and color). When a customer places an order, the specific variant's inventory is reduced.</p>
              </div>
              
              <div>
                <h3 className="font-medium dark:text-white">Why do I need to synchronize inventory?</h3>
                <p className="text-gray-600 dark:text-gray-300">The system automatically reduces inventory when orders are processed, but in some cases (like manual order creation or system issues), the inventory might not update correctly. This tool ensures everything stays in sync.</p>
              </div>
              
              <div>
                <h3 className="font-medium dark:text-white">What happens if a product is out of stock?</h3>
                <p className="text-gray-600 dark:text-gray-300">Out-of-stock products will show as unavailable on the e-commerce website. Customers won't be able to purchase these items until inventory is added.</p>
              </div>
              
              <div>
                <h3 className="font-medium dark:text-white">How do I add more inventory?</h3>
                <p className="text-gray-600 dark:text-gray-300">To add inventory, go to the Products section, edit the product, and update the quantity for each variant.</p>
              </div>
              
              <div>
                <h3 className="font-medium dark:text-white">How does inventory sync between the admin panel and e-commerce site?</h3>
                <p className="text-gray-600 dark:text-gray-300">Both systems share the same database. When inventory is reduced in one system, it's automatically reflected in the other. The synchronization is real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 