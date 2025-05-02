'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Detect if this is one of our problematic routes
    if (pathname === '/orders' || pathname === '/orders/' || 
        pathname === '/settings' || pathname === '/settings/') {
      // Redirect to the dashboard and then use client-side navigation
      router.replace('/dashboard');
      
      // After a brief timeout, try to navigate to the intended page
      setTimeout(() => {
        router.push(pathname.replace(/\/$/, '')); // Remove trailing slash if present
      }, 100);
    }
  }, [pathname, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
        <p>Please wait while we redirect you to the right page.</p>
      </div>
    </div>
  );
}
