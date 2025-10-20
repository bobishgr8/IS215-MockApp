'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useStore();

  useEffect(() => {
    // If logged in, redirect to role-specific page
    if (currentUser) {
      switch (currentUser.role) {
        case 'DONOR':
          router.push('/donor/offers');
          break;
        case 'BENEFICIARY':
          router.push('/beneficiary/needs');
          break;
        case 'VOLUNTEER':
          router.push('/volunteer/routes');
          break;
        case 'OPS':
          router.push('/ops/matches');
          break;
        default:
          router.push('/login');
      }
    } else {
      // Not logged in, redirect to login
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
