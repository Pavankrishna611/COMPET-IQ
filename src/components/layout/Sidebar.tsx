'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getNavigationForRole } from '@/data/navigation';
import { Logo } from '@/components/common';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  LayoutDashboard,
  Target,
  AlertTriangle,
  Route,
  BookOpen,
  BookmarkCheck,
  ClipboardCheck,
  Sparkles,
  Users,
  BarChart3,
  GraduationCap,
  BrainCircuit,
  FileSpreadsheet,
  Database,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Target,
  AlertTriangle,
  Route,
  BookOpen,
  BookmarkCheck,
  ClipboardCheck,
  Sparkles,
  Users,
  BarChart3,
  GraduationCap,
  BrainCircuit,
  FileSpreadsheet,
  Database,
  LogOut,
  User,
};

export interface SidebarProps {
  role?: Role;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({
  role: propRole,
  isCollapsed,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { role: authRole, logout } = useAuth();
  const currentRole: Role = propRole || authRole || 'learner';
  const { mainItems } = getNavigationForRole(currentRole);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between bg-navy text-white transition-all duration-200 border-r border-[#0E2E50] shrink-0 z-30 select-none h-screen sticky top-0',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Top Branding & Collapse Button */}
      <div>
        <div
          className={cn(
            'h-16 flex items-center border-b border-white/10 px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed ? (
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <Logo size="md" className="h-9 w-auto" />
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center hover:opacity-90 transition-opacity">
              <Logo collapsed={true} className="h-8 w-8 object-contain" />
            </Link>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-1.5 rounded-btn text-[#A5C2DE] hover:text-white hover:bg-white/10 transition-colors',
              isCollapsed && 'hidden'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Quick Button */}
        {isCollapsed && (
          <div className="p-2 flex justify-center border-b border-white/10">
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="p-1.5 rounded-btn text-[#A5C2DE] hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Navigation Items */}
        <nav className="p-3 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold text-[#8FB5D8] uppercase tracking-wider mb-1 mt-2">
              {currentRole === 'admin'
                ? 'Administration & Workforce'
                : currentRole === 'trainer'
                  ? 'Trainer Management'
                  : 'Competency & Learning'}
            </span>
          )}

          {mainItems.map((item) => {
            const Icon = iconMap[item.iconName] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== '/') ||
              (item.href === '/learner/assessments' && (pathname === '/learner/quiz' || pathname.startsWith('/learner/quiz/')));

            const content = (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-btn text-xs font-medium transition-colors relative',
                  isActive
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-[#C7DCF0] hover:text-white hover:bg-white/10',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-[#9DBDD8]'
                  )}
                />

                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}

                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0',
                      item.badgeVariant === 'warning'
                        ? 'bg-warning text-white'
                        : item.badgeVariant === 'ai'
                          ? 'bg-ai-purple text-white'
                          : 'bg-teal text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.id} content={item.label} position="right">
                  {content}
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>
      </div>

      {/* Bottom Sign Out Navigation */}
      <div className="p-3 border-t border-white/10 flex flex-col gap-1">
        <button
          onClick={logout}
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-btn text-xs font-medium text-critical-light hover:text-white hover:bg-critical/30 transition-colors w-full text-left',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 text-critical-light group-hover:text-white" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
