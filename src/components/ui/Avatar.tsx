import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  cadreBadge?: string;
  className?: string;
}

export function Avatar({
  name,
  avatarUrl,
  size = 'md',
  cadreBadge,
  className,
}: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={cn(
          'rounded-full bg-navy text-white font-semibold flex items-center justify-center border border-border overflow-hidden select-none',
          sizes[size],
          className
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {cadreBadge && (
        <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-teal text-[9px] font-bold text-white rounded border border-white leading-tight">
          {cadreBadge}
        </span>
      )}
    </div>
  );
}
