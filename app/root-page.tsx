'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const currentUser = useStore(state => state.currentUser);

  useEffect(() => {
    // Wait for hydration
    if (typeof window !== 'undefined') {
      if (currentUser) {
        // Redirect based on role
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
        }
      } else {
        router.push('/login');
      }
    }
  }, [currentUser, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">Loading Food Bank Singapore...</p>
      </div>
    </div>
  );
}
