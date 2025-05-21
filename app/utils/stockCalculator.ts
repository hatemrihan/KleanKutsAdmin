interface ColorVariant {
  color: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

interface Product {
  _id: string;
  stock?: number;
  sizeVariants?: SizeVariant[];
}

/**
 * Calculates the total stock of a product from its size and color variants
 * Falls back to the product's stock field if variants aren't available
 */
export function calculateTotalStock(product: Product): number {
  // If no product, return 0
  if (!product) return 0;
  
  // If there are size variants, sum up their stocks
  if (product.sizeVariants && product.sizeVariants.length > 0) {
    return product.sizeVariants.reduce((totalStock, sizeVariant) => {
      // If no color variants, don't add anything
      if (!sizeVariant.colorVariants || sizeVariant.colorVariants.length === 0) {
        return totalStock;
      }
      
      // Sum up stock for all color variants of this size
      const sizeStock = sizeVariant.colorVariants.reduce((sum, colorVariant) => {
        return sum + (Number(colorVariant.stock) || 0);
      }, 0);
      
      return totalStock + sizeStock;
    }, 0);
  }
  
  // Fall back to product.stock if no variants
  return product.stock || 0;
} 