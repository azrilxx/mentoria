'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthStateChange } from '@/lib/firebaseAuth';
import { Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and redirect to dashboard
    const currentUser = getCurrentUser();
    if (currentUser) {
      router.push('/dashboard');
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    });

    // If no current user, redirect to login
    if (!currentUser) {
      router.push('/login');
    }

    return () => unsubscribe();
  }, [router]);

  // Show loading while determining auth state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="text-center">
        <Icons.logo className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mentoria Onboard
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
