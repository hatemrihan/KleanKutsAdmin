'use client';

import EditProductForm from './EditProductForm';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function EditProductContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return <div>Missing product ID</div>;
  }

  return <EditProductForm id={id} />;
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProductContent />
    </Suspense>
  );
} 