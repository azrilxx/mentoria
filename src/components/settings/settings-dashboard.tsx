
'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, User, getUserSettings, UserSettings, saveUserSettings } from '@/lib/firebaseAuth';
import { Loader2 } from 'lucide-react';
import { ProfileCard } from './profile-card';
import { SubscriptionCard } from './subscription-card';
import { NotificationsCard } from './notifications-card';
import { useToast } from '@/hooks/use-toast';

export function SettingsDashboard() {
  const [user, setUser] = useState<(User & { companyId?: string; subscriptionTier?: string; role?: string; }) | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userSettings = await getUserSettings(currentUser.uid);
        setSettings(userSettings);
      }
      setIsLoading(false);
    };
    loadUserData();
  }, []);

  const handleSettingsChange = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await saveUserSettings(user.uid, updatedSettings);
      toast({
        title: "Settings Updated",
        description: "Your new settings have been saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update on failure
      const originalSettings = await getUserSettings(user.uid);
      setSettings(originalSettings);
    }
  };

  if (isLoading || !user || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const companyName = user.companyId ? "Desaria Group" : "Personal Account";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <ProfileCard user={user} companyName={companyName} />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <SubscriptionCard subscriptionTier={user.subscriptionTier} role={user.role} />
        <NotificationsCard settings={settings} onSettingsChange={handleSettingsChange} />
      </div>
    </div>
  );
}
