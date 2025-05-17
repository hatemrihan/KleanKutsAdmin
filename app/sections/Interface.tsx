"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'react-hot-toast';
import { Toaster } from 'sonner';
import axios, { AxiosError } from 'axios';

export default function Interface() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        // Check if there's an admin-auth value in localStorage
        let localAuth = false;
        
        // Safe check for localStorage (might not be available in SSR)
        if (typeof window !== 'undefined') {
          localAuth = localStorage.getItem('admin-auth') === 'true';
          
          // If we have local storage auth but no cookie auth, clear localStorage
          // This will prevent automatic re-login after logout
          try {
            const response = await axios.get('/api/auth/check', {
              withCredentials: true
            });
            
            if (response.data.authenticated) {
              // We're already authenticated via cookie, proceed to dashboard
              router.push('/dashboard');
            } else if (localAuth) {
              // We have localStorage auth but no cookie auth
              // Clear localStorage to prevent automatic re-login
              localStorage.removeItem('admin-auth');
              localStorage.removeItem('adminAuthenticated');
              console.log('Cleared local storage auth because no valid cookie found');
            }
          } catch (error) {
            // API error, assume not authenticated
            // Clear any localStorage auth to be safe
            if (localAuth) {
              localStorage.removeItem('admin-auth');
              localStorage.removeItem('adminAuthenticated');
              console.log('Cleared local storage auth due to API error');
            }
            console.log('Not authenticated, showing login screen');
          }
        }
      } catch (error) {
        // Not authenticated, stay on login page
        console.log('Not authenticated, showing login screen');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Starting login process...');
      const response = await axios.post('/api/auth/admin-login', { 
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      console.log('Server response received:', response.status);
      
      if (response.data.success) {
        console.log('Login successful, preparing to redirect...');
        toast.success('Login successful! Redirecting...');
        
        // Store authentication in local storage as a backup
        localStorage.setItem('admin-auth', 'true');
        
        // Small delay to ensure cookie is set
        setTimeout(() => {
          console.log('Executing redirect to dashboard...');
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (error: unknown) {
      console.error('Login attempt failed:', error);
      const axiosError = error as AxiosError<{ error: string }>;
      
      let errorMessage = 'Login failed. Please try again.';
      if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }
      
      console.error('Error details:', {
        status: axiosError.response?.status,
        message: errorMessage,
        data: axiosError.response?.data
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black p-4">
      <h1 className="text-4xl md:text-5xl font-light text-center mb-8 dark:text-white">WELCOME SEIF!</h1>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-4 max-w-2xl">
        Please enter the admin password to access the dashboard. Only authorized personnel can proceed.
      </p>

      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        If you are not an administrator, please return to the main site.
      </p>

      <div className="w-[90%] max-w-[400px] mx-auto">
        <Card className="border rounded-lg dark:bg-black/40 dark:border-gray-800">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 text-lg border-gray-200 dark:border-gray-700 dark:bg-black dark:text-white focus:border-black dark:focus:border-white transition-colors text-center"
                  required
                />
                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors text-white dark:text-black text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'ACCESS DASHBOARD'
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
      {mounted && <Toaster position="top-center" richColors closeButton />}
    </div>
  );
}
