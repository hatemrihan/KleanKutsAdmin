import fs from 'fs';
import path from 'path';
import { BLACKLISTED_PRODUCT_IDS } from './productBlacklist';

/**
 * Adds a product ID to the blacklist file
 * @param productId - The product ID to add to the blacklist
 */
export async function addToBlacklist(productId: string): Promise<void> {
  try {
    // Check if the product ID is already in the blacklist
    if (BLACKLISTED_PRODUCT_IDS.includes(productId)) {
      console.log(`Product ${productId} is already in the blacklist`);
      return;
    }

    // Add the product ID to the blacklist
    const updatedBlacklist = [...BLACKLISTED_PRODUCT_IDS, productId];
    
    // Generate the updated file content
    const fileContent = `/**
 * Product Blacklist
 * 
 * This file contains a list of product IDs that have been deleted but might still
 * exist in user carts. The e-commerce frontend will check this list and remove
 * any blacklisted products from the cart to prevent "Product not found" errors.
 * 
 * This is a temporary solution until a more robust database-level solution is implemented.
 */

export const BLACKLISTED_PRODUCT_IDS = [
${updatedBlacklist.map(id => `  '${id}'`).join(',\n')}
];

/**
 * Checks if a product ID is in the blacklist
 * @param productId - The product ID to check
 * @returns true if the product is blacklisted, false otherwise
 */
export function isProductBlacklisted(productId: string): boolean {
  return BLACKLISTED_PRODUCT_IDS.includes(productId);
}`;

    // Write the updated content to the file
    const filePath = path.join(process.cwd(), 'app', 'utils', 'productBlacklist.ts');
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    console.log(`Added product ${productId} to the blacklist`);
  } catch (error) {
    console.error('Error updating blacklist:', error);
    throw error;
  }
}
