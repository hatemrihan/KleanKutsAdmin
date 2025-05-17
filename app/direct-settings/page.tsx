'use client';

// Import necessary components
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DirectSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Force navigation to settings page and bypass all checks
    router.push('/settings');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Settings...</h1>
      <p>If you are not redirected, <Link href="/settings" className="text-blue-500 underline">click here</Link></p>
    </main>
  );
} 