'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

/**
 * Bouton à la charte EVERBLOOM (vert/beige/or).
 * Une seule action primaire par vue : utiliser `primary` pour cette action,
 * `secondary` (contour) pour les actions de second rang, `ghost` pour le texte seul.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100';

  const variants = {
    primary: 'bg-[#1E4D3A] text-[#E8E0D5] shadow-lg hover:bg-[#1E4D3A]/90 hover:scale-[1.02] active:scale-95',
    secondary:
      'border border-[#1E4D3A] text-[#1E4D3A] bg-transparent hover:bg-[#1E4D3A] hover:text-[#E8E0D5] active:scale-95',
    ghost: 'text-[#1E4D3A] hover:bg-[#1E4D3A]/5 active:scale-95',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--font-sans)' }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
