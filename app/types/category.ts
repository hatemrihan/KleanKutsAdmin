export interface CategoryRequest {
  name: string;
  description?: string;
  parent?: string;
  image?: string;
  properties?: {
    [key: string]: string[];
  };
  deleted?: boolean;
  deletedAt?: string;
  slug?: string;
}

export interface Category extends CategoryRequest {
  _id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
} 