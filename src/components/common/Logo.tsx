'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  collapsed?: boolean;
  priority?: boolean;
  href?: string;
  variant?: 'horizontal' | 'icon' | 'full';
  theme?: 'dark' | 'light' | 'auto';
}

export function Logo({
  className,
  size = 'md',
  collapsed = false,
  priority = true,
  href,
  variant,
  theme = 'auto',
}: LogoProps) {
  const isIcon = collapsed || variant === 'icon';

  const iconSizes = {
    sm: { size: 24, class: 'h-6 w-6' },
    md: { size: 28, class: 'h-7 w-7' },
    lg: { size: 36, class: 'h-9 w-9' },
    xl: { size: 44, class: 'h-11 w-11' },
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const currentIcon = iconSizes[size] || iconSizes.md;
  const currentTextSize = textSizes[size] || textSizes.md;

  const content = (
    <div
      className={cn(
        'inline-flex items-center gap-2 select-none font-sans leading-none',
        className
      )}
    >
      {/* Brand Icon Mark */}
      <div className={cn('relative shrink-0 flex items-center justify-center', currentIcon.class)}>
        <Image
          src="/logo-icon.png"
          alt="CompetIQ Icon"
          width={currentIcon.size * 2}
          height={currentIcon.size * 2}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Wordmark (CompetIQ) */}
      {!isIcon && (
        <span
          className={cn(
            'font-black tracking-tight flex items-baseline',
            currentTextSize,
            theme === 'light'
              ? 'text-navy'
              : theme === 'dark'
              ? 'text-white'
              : 'text-inherit'
          )}
        >
          <span>Compet</span>
          <span className="text-teal font-black ml-[0.5px]">IQ</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
