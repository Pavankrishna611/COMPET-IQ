import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  rows?: number;
}

export function LoadingState({
  message = 'Loading intelligence data...',
  className,
  rows = 3,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('w-full p-6 flex flex-col gap-4 animate-pulse', className)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-btn bg-[#E4ECF4]" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="w-1/3 h-4 rounded bg-[#E4ECF4]" />
          <div className="w-1/2 h-3 rounded bg-[#EDF2F7]" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 pt-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="w-full h-8 rounded bg-[#EDF2F7]"
            style={{ opacity: 1 - idx * 0.2 }}
          />
        ))}
      </div>
      {message && (
        <p className="text-xs text-text-muted text-center pt-2 font-medium">
          {message}
        </p>
      )}
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#E4ECF4]', className)}
      {...props}
    />
  );
}
