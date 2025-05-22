/**
 * Product Blacklist
 * 
 * This file contains a list of product IDs that have been deleted but might still
 * exist in user carts. The e-commerce frontend will check this list and remove
 * any blacklisted products from the cart to prevent "Product not found" errors.
 * 
 * This is a temporary solution until a more robust database-level solution is implemented.
 */

export const BLACKLISTED_PRODUCT_IDS = [
  '6819b110064b2eeffa2c1941',
  '6819a258828e01d7e7d17e95',
  '6816bcc6917b46e8422f3be5',
  '6816c312917b46e8422f3c17'
];

/**
 * Checks if a product ID is in the blacklist
 * @param productId - The product ID to check
 * @returns true if the product is blacklisted, false otherwise
 */
export function isProductBlacklisted(productId: string): boolean {
  return BLACKLISTED_PRODUCT_IDS.includes(productId);
}