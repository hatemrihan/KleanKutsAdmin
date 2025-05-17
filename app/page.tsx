'use client';
import Interface from './sections/Interface';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Only redirect to dashboard when homepage is explicitly visited
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      // Set a flag to indicate authentication
      localStorage.setItem('adminAuthenticated', 'true');
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Interface />
    </main>
  );
}
