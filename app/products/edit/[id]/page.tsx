import { Metadata } from 'next';
import EditProductForm from './EditProductForm';

export const metadata: Metadata = {
  title: 'Edit Product',
  description: 'Edit product details',
};

// For dynamic routes using [id] in the path
export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditProductForm id={params.id} />;
} 