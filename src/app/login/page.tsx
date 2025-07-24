'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUser } from '@/lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
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
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-sans">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-pt-sans">Loading Mentoria...</span>
          <div className="relative overflow-hidden h-4 w-32 rounded-md bg-muted ml-4">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header with company branding */}
      <header className="w-full py-6 px-4 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Icons.logo className="h-10 w-10 text-primary mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-foreground font-montserrat">
              Mentoria Onboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-pt-sans">
              Your AI-Assisted Onboarding Partner
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome message */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 font-montserrat">
              Welcome back!
            </h2>
            <p className="text-muted-foreground text-lg font-pt-sans">
              Sign in to continue your onboarding journey
            </p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Additional information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground font-pt-sans">
              Need help? Contact your HR administrator or{' '}
              <a 
                href="mailto:support@witventure.com" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                support@witventure.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-muted-foreground font-pt-sans">
            © 2025 Desaria Group. Powered by Mentoria Onboard.
          </p>
        </div>
      </footer>
    </div>
  );
}