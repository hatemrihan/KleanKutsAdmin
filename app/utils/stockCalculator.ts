interface ColorVariant {
  color: string;
  stock: number;
}

interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

export function calculateTotalStock(product: any): number {
  // If product has sizeVariants with colorVariants, calculate stock from them
  if (product.sizeVariants && Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
    return product.sizeVariants.reduce((totalStock: number, sizeVariant: SizeVariant) => {
      if (!sizeVariant.colorVariants || !Array.isArray(sizeVariant.colorVariants)) {
        return totalStock;
      }
      
      return totalStock + sizeVariant.colorVariants.reduce((sizeTotal: number, colorVariant: ColorVariant) => {
        return sizeTotal + (Number(colorVariant.stock) || 0);
      }, 0);
    }, 0);
  } 
  
  // If no size variants, return the direct stock value or 0
  return product.stock || 0;
} 