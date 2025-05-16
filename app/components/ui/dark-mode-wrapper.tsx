'use client';

import React from 'react';
import { cn } from "../../../lib/utils";

// This component adds dark mode support to any element or component
// Use it to wrap components that don't have dark mode styles yet

export function DarkModeCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300", 
      className
    )}>
      {children}
    </div>
  );
}

export function DarkModePanel({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-900 dark:text-white transition-colors duration-300", 
      className
    )}>
      {children}
    </div>
  );
}

export function DarkModeInput({ 
  className, 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn(
        "bg-white dark:bg-black border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-300", 
        className
      )}
      {...props} 
    />
  );
}

export function DarkModeButton({ 
  className, 
  variant = 'primary',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' 
}) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 dark:bg-black dark:hover:bg-black/80 text-gray-900 dark:text-white transition-colors duration-300",
    danger: "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white",
    success: "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-white"
  };

  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors duration-300", 
        variantClasses[variant],
        className
      )}
      {...props} 
    />
  );
}

export function DarkModeText({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(
      "text-gray-900 dark:text-white transition-colors duration-300", 
      className
    )}>
      {children}
    </span>
  );
}

// This helps style table elements
export function DarkModeTable({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table className={cn(
      "w-full border-collapse", 
      className
    )}>
      {children}
    </table>
  );
}

export function DarkModeTableHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn(
      "bg-gray-100 dark:bg-black text-gray-900 dark:text-white", 
      className
    )}>
      {children}
    </thead>
  );
}

export function DarkModeTableRow({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn(
      "border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-black/80 transition-colors duration-150", 
      className
    )}>
      {children}
    </tr>
  );
}

export function DarkModeTableCell({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn(
      "px-4 py-3 text-gray-900 dark:text-white", 
      className
    )}>
      {children}
    </td>
  );
}

// Label component
export function DarkModeLabel({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn(
      "block text-sm font-medium text-gray-700 dark:text-white/70 mb-1", 
      className
    )}>
      {children}
    </label>
  );
}

// Badge/status component
export function DarkModeStatus({ 
  children, 
  status = 'default',
  className 
}: { 
  children: React.ReactNode;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const statusClasses = {
    default: "bg-gray-100 text-gray-800 dark:bg-black dark:text-white/70",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium", 
      statusClasses[status],
      className
    )}>
      {children}
    </span>
  );
} 