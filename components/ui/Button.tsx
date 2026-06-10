'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-black text-white shadow hover:bg-black/90',
    secondary: 'bg-white text-black border border-gray-200 hover:bg-gray-100',
    outline: 'border border-black bg-transparent hover:bg-gray-100',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} h-10 px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
