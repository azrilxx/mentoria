'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUser } from '@/lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header with company branding */}
      <header className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Mentoria Onboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Witventure Learning Experience Platform
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome message */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to continue your onboarding journey
            </p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Additional information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
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
      <footer className="w-full py-6 px-4 border-t bg-white/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            © 2025 Desaria Group. Powered by Mentoria Onboard.
          </p>
        </div>
      </footer>
    </div>
  );
}