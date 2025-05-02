export interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  discount?: number;
  discountType?: string;
  selectedSizes?: string[];
  gender?: string;
  color?: string;
  selectedImages?: string[];
  categories?: string[];
  deleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
} 