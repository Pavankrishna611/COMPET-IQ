'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { getNotificationsForRole, RoleNotification } from '@/data/notifications';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  currentUser?: User;
  onOpenMobileMenu: () => void;
  className?: string;
}

export function Header({
  title = 'Intelligence Dashboard',
  breadcrumbs,
  currentUser: propUser,
  onOpenMobileMenu,
  className,
}: HeaderProps) {
  const router = useRouter();
  const { role, currentUser: authUser, logout } = useAuth();
  const activeUser = propUser || authUser || {
    id: 'guest',
    name: 'Arjun Kumar',
    email: 'arjun.kumar@mospi.gov.in',
    designation: 'Statistical Investigator',
    department: 'Survey Design and Research Division',
    cadre: 'SSS',
    role: 'learner',
    employeeId: 'SSS-2021-0892',
    joinedDate: '2021-07-15',
  };

  const currentRole = role || activeUser.role;

  // Local state for notifications and marking as read
  const [notifications, setNotifications] = useState<RoleNotification[]>(() =>
    getNotificationsForRole(currentRole)
  );
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Sync notifications when role changes
  React.useEffect(() => {
    setNotifications(getNotificationsForRole(currentRole));
  }, [currentRole]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const profileMenuItems: DropdownItem[] = [
    {
      id: 'officer-info',
      label: `${activeUser.designation} (${activeUser.cadre})`,
      onClick: () => {},
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => {
        if (currentRole === 'learner') {
          router.push('/learner/profile');
        } else {
          router.push(`/${currentRole}/dashboard`);
        }
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {
        setSettingsNotice('Settings coming soon');
        setTimeout(() => setSettingsNotice(null), 3000);
      },
    },
    {
      id: 'divider',
      label: '',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Sign Out',
      variant: 'danger',
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => logout(),
    },
  ];

  return (
    <header
      className={cn(
        'h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0',
        className
      )}
    >
      {/* Settings Toast Notice */}
      {settingsNotice && (
        <div className="absolute top-18 right-6 z-50 bg-navy text-white text-xs font-medium px-4 py-2 rounded-btn shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {settingsNotice}
        </div>
      )}

      {/* Left Area: Mobile Menu Toggle & Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation menu"
          className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-[#F0F4F8] rounded-btn transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-0.5">
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  {b.href ? (
                    <a href={b.href} className="hover:text-primary transition-colors">
                      {b.label}
                    </a>
                  ) : (
                    <span className="text-text-secondary font-medium">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : null}

          <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Area: Demo Badge, Search, Notifications, User Identity */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Demo Mode Indicator Badge */}
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-light text-teal border border-teal/20">
          <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0 animate-pulse" />
          Demo Mode
        </span>

        {/* Compact Search Input */}
        <div className="hidden lg:flex items-center relative w-56">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Search competencies..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F5F8FC] border border-border rounded-btn text-text-primary placeholder:text-text-muted/80 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all"
          />
        </div>

        {/* Notification Bell with Custom Interactive Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-[#F0F4F8] rounded-btn transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-panel bg-surface border border-border shadow-modal z-50 overflow-hidden animate-in fade-in duration-100"
            >
              <div className="p-3.5 border-b border-border-light flex items-center justify-between bg-[#F9FBFC]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary-light text-primary px-1.5 py-0.2 rounded">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border-light">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        'p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#F5F8FC]',
                        !notif.read && 'bg-primary-light/30'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'ai' ? (
                          <Sparkles className="w-4 h-4 text-ai-purple" />
                        ) : notif.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        ) : notif.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <Info className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-semibold text-text-primary truncate">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-text-muted shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-snug">
                          {notif.message}
                        </p>
                      </div>

                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-border-light text-center bg-[#F9FBFC]">
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-border-light hidden sm:block" />

        {/* User Identity & Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div
              role="button"
              className="flex items-center gap-2 p-1 hover:bg-[#F5F8FC] rounded-btn transition-colors select-none"
            >
              <Avatar
                name={activeUser.name}
                avatarUrl={activeUser.avatarUrl}
                cadreBadge={activeUser.cadre}
                size="sm"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-text-primary leading-tight">
                  {activeUser.name}
                </span>
                <span className="text-[10px] text-text-muted uppercase font-medium">
                  {activeUser.designation}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
            </div>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
}
