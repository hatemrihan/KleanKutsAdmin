export interface CategoryRequest {
  name: string;
  description?: string;
  headline?: string;
  subheadline?: string;
  displayOrder?: number;
  callToAction?: {
    text: string;
    link: string;
  };
  customStyles?: {
    textColor: string;
    backgroundColor: string;
    overlayOpacity: number;
  };
  isActive?: boolean;
  parent?: string;
  image?: string;
  mobileImage?: string;
  additionalImages?: string[];
  desktopDescription?: string;
  mobileDescription?: string;
  layout?: {
    desktop: {
      imagePosition: 'left' | 'right' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
    mobile: {
      imagePosition: 'top' | 'bottom' | 'center';
      textAlignment: 'left' | 'right' | 'center';
    };
  };
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