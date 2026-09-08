'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Role, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header, BreadcrumbItem } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { Loader2 } from 'lucide-react';

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  defaultRole?: Role;
  className?: string;
  disableRouteProtection?: boolean;
}

export function AppShell({
  children,
  title,
  breadcrumbs,
  defaultRole,
  className,
  disableRouteProtection = false,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { role, currentUser, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Route Protection & Role Guard (Section 9)
  useEffect(() => {
    if (disableRouteProtection) return;

    // If not authenticated, redirect to /login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Role-based route guard
    if (role === 'learner' && (pathname.startsWith('/admin') || pathname.startsWith('/trainer'))) {
      router.replace('/learner/dashboard');
    } else if (role === 'admin' && (pathname.startsWith('/learner') || pathname.startsWith('/trainer'))) {
      router.replace('/admin/dashboard');
    } else if (role === 'trainer' && (pathname.startsWith('/learner') || pathname.startsWith('/admin'))) {
      router.replace('/trainer/assessment-generator');
    }
  }, [isAuthenticated, role, pathname, router, disableRouteProtection]);

  // Loading state before auth verification on protected pages
  if (!disableRouteProtection && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-text-secondary">
          Checking COMPETIQ session authorization...
        </span>
      </div>
    );
  }

  const activeRole: Role = role || defaultRole || 'learner';

  return (
    <div className="h-screen bg-background flex flex-row overflow-hidden">
      {/* Desktop Persistent Navy Sidebar */}
      <Sidebar
        role={activeRole}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Mobile Drawer Navigation */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        role={activeRole}
      />

      {/* Workspace Column (Header + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title={title}
          breadcrumbs={breadcrumbs}
          currentUser={currentUser || undefined}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        {/* Main Content Area (Independent Scroll Container) */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn('p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto', className)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
