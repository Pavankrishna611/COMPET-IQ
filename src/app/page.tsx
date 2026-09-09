'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import { LoadingState } from '@/components/ui';

export default function RootPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
    } else {
      switch (user.role) {
        case 'admin':
          router.replace('/admin/dashboard');
          break;
        case 'trainer':
          router.replace('/trainer/dashboard');
          break;
        case 'learner':
        default:
          (async () => {
            try {
              const status = await onboardingService.getStatus();
              if (status.profile_completed && status.onboarding_completed) {
                router.replace('/learner/dashboard');
              } else {
                router.replace('/onboarding');
              }
            } catch {
              router.replace('/onboarding');
            }
          })();
          break;
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-btn bg-navy text-white flex items-center justify-center font-bold text-lg shadow-sm">
            C
          </div>
          <span className="font-bold text-xl tracking-tight text-navy">
            COMPET<span className="text-primary font-black">IQ</span>
          </span>
        </div>
        <LoadingState message="Redirecting to authorized platform workspace..." rows={2} />
      </div>
    </div>
  );
}
