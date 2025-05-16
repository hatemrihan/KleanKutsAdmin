"use client";

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    // This code runs only on the client side
    try {
      if (localStorage.theme === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      // Handle any errors accessing localStorage
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  return null; // This component doesn't render anything
} 