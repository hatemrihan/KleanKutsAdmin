import { redirect } from 'next/navigation';

export default function ProductPage({ params }: { params: { id: string } }) {
  // Redirect to the edit page
  redirect(`/products/edit/${params.id}`);
} 