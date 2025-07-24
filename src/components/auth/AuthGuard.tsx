'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getCurrentUser } from '@/lib/firebaseAuth';
import { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check current user immediately
    const currentUser = getCurrentUser();
    
    if (requireAuth && !currentUser) {
      router.push(redirectTo || '/login');
      return;
    } else if (!requireAuth && currentUser) {
      router.push(redirectTo || '/dashboard');
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);

      if (requireAuth && !user) {
        router.push(redirectTo || '/login');
      } else if (!requireAuth && user) {
        router.push(redirectTo || '/dashboard');
      }
    });

    // If we have a current user, set loading to false immediately
    if (currentUser) {
      setUser(currentUser);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // For protected routes, only render if user is authenticated
  if (requireAuth && !user) {
    return null;
  }

  // For public routes (like login), only render if user is not authenticated
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}