export interface ColorVariant {
  color: string;
  stock: number;
}

export interface SizeVariant {
  size: string;
  colorVariants: ColorVariant[];
}

export interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  sizeVariants?: SizeVariant[];
  stock: number; // Keep for backwards compatibility
  discount?: number;
  discountType?: string;
  selectedSizes?: string[]; // Keep for backwards compatibility
  gender?: string;
  color?: string; // Keep for backwards compatibility
  selectedImages?: string[];
  categories?: string[];
  deleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}