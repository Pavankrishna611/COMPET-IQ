'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getNavigationForRole } from '@/data/navigation';
import {
  LayoutDashboard,
  Target,
  AlertTriangle,
  Route,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Users,
  BarChart3,
  GraduationCap,
  BrainCircuit,
  FileSpreadsheet,
  Database,
  Settings,
  LogOut,
  User,
  X,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Target,
  AlertTriangle,
  Route,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  Users,
  BarChart3,
  GraduationCap,
  BrainCircuit,
  FileSpreadsheet,
  Database,
  Settings,
  LogOut,
  User,
};

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role;
}

export function MobileSidebar({ isOpen, onClose, role: propRole }: MobileSidebarProps) {
  const pathname = usePathname();
  const { role: authRole, logout } = useAuth();
  const currentRole: Role = propRole || authRole || 'learner';
  const { mainItems } = getNavigationForRole(currentRole);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-navy-dark/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 left-0 w-72 bg-navy text-white shadow-2xl flex flex-col justify-between z-10 transition-transform animate-in slide-in-from-left duration-200">
        {/* Top Branding & Close Button */}
        <div>
          <div className="h-16 flex items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-btn bg-teal flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-sm">
                CQ
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-wider text-base text-white leading-none">
                  COMPET<span className="text-teal">IQ</span>
                </span>
                <span className="text-[10px] text-[#A5C2DE] tracking-tight uppercase font-medium mt-0.5">
                  Skill Intelligence Platform
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-btn text-[#A5C2DE] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            <span className="px-3 text-[10px] font-bold text-[#8FB5D8] uppercase tracking-wider mb-2">
              {currentRole === 'admin'
                ? 'Administration & Workforce'
                : currentRole === 'trainer'
                  ? 'Trainer Management'
                  : 'Competency & Learning'}
            </span>

            {mainItems.map((item) => {
              const Icon = iconMap[item.iconName] || LayoutDashboard;
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== '/') ||
                (item.href === '/learner/assessments' && (pathname === '/learner/quiz' || pathname.startsWith('/learner/quiz/')));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-btn text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-[#C7DCF0] hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-[#9DBDD8]')} />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
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
            })}
          </nav>
        </div>

        {/* Bottom Settings & Logout */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-1">
          <button
            onClick={() => {
              onClose();
              alert('Settings coming soon');
            }}
            className="flex items-center gap-3 px-3.5 py-2 rounded-btn text-xs font-medium text-[#A5C2DE] hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            <Settings className="w-4 h-4 shrink-0 text-[#8EB2D5]" />
            <span className="truncate">Settings</span>
          </button>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-3 px-3.5 py-2 rounded-btn text-xs font-medium text-critical-light hover:text-white hover:bg-critical/30 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0 text-critical-light" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
