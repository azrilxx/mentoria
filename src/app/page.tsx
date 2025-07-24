'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthStateChange, getCompanyBranding } from '@/lib/firebaseAuth';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setLoading(true);
        // Fetch user's subscription tier and company info
        const companyId = user.companyId;
        const subscriptionTier = user.subscriptionTier || 'free';

        if (companyId) {
          const branding = await getCompanyBranding(companyId);
          if (branding) {
            setCompanyLogo(branding.logoUrl || null);
            setWelcomeMessage(
              `Welcome, ${branding.name || ''} - ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Track Activated`
            );
          } else {
            setWelcomeMessage(`Welcome Back - ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Track Activated`);
          }
        } else {
          setWelcomeMessage(`Welcome Back - ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Track Activated`);
        }

        // Simulate a welcome screen delay for premium feel
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000); // 2-second delay for the welcome message

      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || welcomeMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-white to-background font-sans">
        <div className="text-center p-8 rounded-lg shadow-xl bg-card border border-border animate-in fade-in-0 zoom-in-95 duration-500">
          {companyLogo ? (
            <img src={companyLogo} alt="Company Logo" className="h-20 w-auto mx-auto mb-6 object-contain" />
          ) : (
            <Icons.logo className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-montserrat">
            {welcomeMessage ? welcomeMessage : "Loading Mentoria..."}
          </h1>
          {!welcomeMessage && (
            <div className="flex items-center gap-3 text-muted-foreground justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg">Preparing your experience</span>
              {/* Shimmer effect for premium loading */}
              <div className="relative overflow-hidden h-4 w-32 rounded-md bg-muted ml-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null; // Should not reach here if loading or welcomeMessage is true
}
