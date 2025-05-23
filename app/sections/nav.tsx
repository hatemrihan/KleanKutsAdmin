'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
  subItems?: {
    label: string;
    href: string;
    icon: JSX.Element;
  }[];
}

interface SiteStatus {
  active: boolean;
  message: string;
}

const Nav = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({ active: true, message: '' });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Refs for animated elements
  const topLineRef = useRef<HTMLDivElement>(null);
  const bottomLineRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Fetch site status when component mounts
  useEffect(() => {
    fetchSiteStatus();
  }, []);

  // Handle menu animation
  useEffect(() => {
    if (!topLineRef.current || !bottomLineRef.current || !mobileMenuRef.current) return;

    if (isMobileMenuOpen) {
      // Animate hamburger to X
      // First translateY
      topLineRef.current.style.transform = 'translateY(4px)';
      bottomLineRef.current.style.transform = 'translateY(-4px)';
      
      // Then rotate after a small delay
      setTimeout(() => {
        if (topLineRef.current && bottomLineRef.current) {
          topLineRef.current.style.transform = 'translateY(4px) rotate(45deg)';
          bottomLineRef.current.style.transform = 'translateY(-4px) rotate(-45deg)';
        }
      }, 150);

      // Animate menu in - change to 100vh to ensure full content is visible
      mobileMenuRef.current.style.height = '100vh';
    } else {
      // Animate X to hamburger
      // First remove rotation
      topLineRef.current.style.transform = 'translateY(4px) rotate(0deg)';
      bottomLineRef.current.style.transform = 'translateY(-4px) rotate(0deg)';
      
      // Then reset translateY after a small delay
      setTimeout(() => {
        if (topLineRef.current && bottomLineRef.current) {
          topLineRef.current.style.transform = 'translateY(0)';
          bottomLineRef.current.style.transform = 'translateY(0)';
        }
      }, 150);

      // Animate menu out
      mobileMenuRef.current.style.height = '0';
    }
  }, [isMobileMenuOpen]);

  const fetchSiteStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await axios.get('/api/settings/site-status');
      if (response.data.status === 'success') {
        setSiteStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching site status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const getActiveLinks = (currentPath: string) => {
    const activeLinks = new Set<string>();
    activeLinks.add(currentPath);
    
    if (currentPath === '/products' || currentPath === '/categories') {
      activeLinks.add('/dashboard');
    }
    if (currentPath === '/dashboard/inventory') {
      activeLinks.add('/dashboard');
      activeLinks.add('/products');
    }
  
    if (currentPath === '/dashboard/waitlist') {
      activeLinks.add('/dashboard');
    }
    if (currentPath === '/ambassadors' || currentPath.startsWith('/ambassadors/')) {
      activeLinks.add('/dashboard');
    }
    if (currentPath === '/admin/newsletter') {
      activeLinks.add('/dashboard');
    }
    
    return activeLinks;
  };

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" />
        </svg>
      ),
    },
    {
      label: 'Sales Analytics',
      href: '/sales',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Products',
      href: '/products',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    // {
    //   label: 'Inventory',
    //   href: '/dashboard/inventory',
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    //     </svg>
    //   ),
    // },
    // {
    //   label: 'Categories',
    //   href: '/categories',
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    //     </svg>
    //   ),
    // },
    {
      label: 'Promo Codes',
      href: '/coupons',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      label: 'Orders',
      href: '/test',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Ambassadors',
      href: '/ambassadors',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: 'Waitlist',
      href: '/dashboard/waitlist',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M19 11H5" />
        </svg>
      ),
    },
    {
      label: 'Subscribers',
      href: '/admin/newsletter',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/test-settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      subItems: [
        {
          label: 'Facebook Pixel',
          href: '/settings/pixel',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        }
      ]
    },
  ];

  const activeLinks = getActiveLinks(pathname ?? '/');

  return (
    <>
      {/* Enhanced Mobile View - Only visible on mobile */}
      <div className="lg:hidden">
        {/* Mobile Menu Overlay - Full-screen menu that appears on click */}
        <div 
          ref={mobileMenuRef}
          className="fixed top-0 left-0 w-full h-0 overflow-auto z-40 bg-white dark:bg-black dark:text-white transition-all duration-700"
          style={{ height: '0' }}
        >
          <div className="mt-16 flex flex-col">
            {/* Site Status Indicator for Mobile */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-2 px-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Site Status:</div>
                {isLoadingStatus ? (
                  <div className="flex items-center">
                    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin mr-1"></div>
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div 
                      className={`w-2.5 h-2.5 rounded-full mr-1 ${siteStatus.active ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <span 
                      className={`text-sm font-semibold ${siteStatus.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {siteStatus.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Theme Toggle in Mobile Menu */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-2 px-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Theme:</div>
                <ThemeToggle />
              </div>
            </div>
           
            {/* User Profile Section for Mobile */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-black/80 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 016 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-base text-black dark:text-white">WELCOME</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SEIF</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => (
              <div key={item.href} className="border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-black dark:text-white py-4 group relative isolate block"
                >
                  <div className="container !max-w-full flex items-center justify-between">
                    <div className="absolute w-full h-0 bg-gray-100 dark:bg-black/80 group-hover:h-full transition-all duration-500 bottom-0 -z-10"></div>
                    <span className="text-lg group-hover:pl-2 transition-all duration-500 flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </Link>

                {/* Render subitems on mobile */}
                {item.subItems && (
                  <div className="bg-gray-50 dark:bg-black/90">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-800 dark:text-gray-200 py-3 pl-12 group relative isolate block border-t border-gray-200 dark:border-gray-700 text-sm"
                      >
                        <div className="container !max-w-full flex items-center">
                          <span className="mr-2">{subItem.icon}</span>
                          {subItem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Visit Store Link in Mobile Menu */}
            <a 
              href="https://elevee.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black dark:text-white border-t border-gray-200 dark:border-gray-700 py-4 group relative isolate"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="container !max-w-full flex items-center justify-between">
                <div className="absolute w-full h-0 bg-gray-100 dark:bg-black/80 group-hover:h-full transition-all duration-500 bottom-0 -z-10"></div>
                <span className="text-lg group-hover:pl-2 transition-all duration-500 flex items-center">
                  <span className="mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                  VISIT STORE
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </a>
            
            {/* Logout Button in Mobile Menu */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="text-red-600 border-t border-b border-gray-200 dark:border-gray-700 py-4 group relative isolate text-left"
            >
              <div className="container !max-w-full flex items-center justify-between">
                <div className="absolute w-full h-0 bg-red-50 dark:bg-red-900/20 group-hover:h-full transition-all duration-500 bottom-0 -z-10"></div>
                <span className="text-lg group-hover:pl-2 transition-all duration-500 flex items-center">
                  <span className="mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  Logout
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </div>
            </button>
          </div>
        </div>
        
        {/* Fixed Top Header */}
        <div className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
          <div className="container !max-w-full">
            <div className="flex h-16 items-center justify-between px-4">
              {/* Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-black dark:text-white font-bold text-base z-50 relative"
              >
                MENU
                {/* Hidden elements to keep the refs working for the animation */}
                <div className="hidden">
                  <div ref={topLineRef}></div>
                  <div ref={bottomLineRef}></div>
                </div>
              </button>
              
              {/* Theme Toggle in mobile header */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Regular Sidebar - Only visible on desktop */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 text-foreground transition-colors duration-300">
        {/* Admin Logo/Title */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Elevee Admin
          </Link>
          <ThemeToggle />
        </div>

        {/* Visit Store Button */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <a 
            href="https://elevee.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-black dark:bg-black text-white rounded-lg hover:bg-gray-800 dark:hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            VISIT STORE
          </a>
        </div>

        {/* Site Status Indicator */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Site Status:</div>
            {isLoadingStatus ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${siteStatus.active ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span 
                  className={`text-sm font-semibold ${siteStatus.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {siteStatus.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            )}
          </div>
          <Link 
            href="/test-settings" 
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-1 block"
          >
            Change status
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`
                  ${activeLinks.has(item.href) ? 'bg-black dark:bg-black text-white' : 'hover:bg-gray-100 dark:hover:bg-black/80 text-gray-700 dark:text-gray-300'}
                  w-full flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-colors
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
              
              {/* Render subitems if they exist and the parent is active */}
              {item.subItems && activeLinks.has(item.href) && (
                <div className="pl-12 mt-1 mb-2 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`
                        ${pathname === subItem.href ? 'bg-gray-800 dark:bg-black text-white' : 'hover:bg-gray-100 dark:hover:bg-black/80 text-gray-700 dark:text-gray-300'}
                        w-full flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-colors
                      `}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* User Profile Section */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-black/80 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">WELCOME</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SEIF</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-black rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Logout</h3>
            <p className="text-gray-600 dark:text-white/70 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/70 bg-gray-100 dark:bg-black/80 rounded-md hover:bg-gray-200 dark:hover:bg-black/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Call the logout API endpoint
                    await fetch('/api/auth/logout', {
                      method: 'GET',
                      credentials: 'include'
                    });
                    
                    // Clear all auth-related local storage items
                    localStorage.removeItem('adminAuthenticated');
                    localStorage.removeItem('admin-auth');
                    
                    // Redirect to login page - using router.push instead of window.location
                    router.push('/');
                  } catch (error) {
                    console.error('Logout failed:', error);
                    // Still try to redirect even if the API call fails
                    router.push('/');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav; 