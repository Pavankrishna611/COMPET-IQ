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
import { notificationService } from '@/services/notification.service';
import { GlobalSearchBar } from './GlobalSearchBar';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
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

interface DisplayNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: string;
  actionUrl?: string;
}

function formatNotificationTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
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
    name: 'Officer',
    email: '',
    designation: 'Officer',
    department: 'Ministry of Statistics & Programme Implementation',
    cadre: 'Official',
    role: 'learner',
    employeeId: '',
    joinedDate: '',
    avatarUrl: undefined,
  };

  const currentRole = role || activeUser.role;

  // Local state for notifications and marking as read
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const fetchRealNotifications = React.useCallback(async () => {
    try {
      const data = await notificationService.getNotifications(30);
      if (data && data.items) {
        setNotifications(
          data.items.map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            timestamp: formatNotificationTime(item.created_at),
            read: item.is_read,
            type: item.type,
            actionUrl:
              item.action_url ||
              (item.reference_id ? `/learner/quiz?assessment_id=${item.reference_id}` : '/learner/assessments'),
          }))
        );
      }
    } catch {
      // Fallback to empty notifications if offline or no server connection
      setNotifications([]);
    }
  }, []);

  // Sync notifications on mount, role change, and periodic poll
  React.useEffect(() => {
    fetchRealNotifications();
    const interval = setInterval(fetchRealNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchRealNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: DisplayNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    try {
      await notificationService.markAsRead(notif.id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    if (notif.actionUrl) {
      setIsNotificationOpen(false);
      router.push(notif.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const profileMenuItems: DropdownItem[] = [
    {
      id: 'officer-info',
      label: `${activeUser.designation} (${activeUser.cadre})`,
      onClick: () => { },
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

      {/* Right Area: Search, Notifications, User Identity */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Global Search Input with Autocomplete & Dropdown */}
        <GlobalSearchBar className="hidden md:flex" />

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
                      onClick={() => handleNotificationClick(notif)}
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
