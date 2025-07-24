
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserSettings } from '@/lib/firebaseAuth';

interface NotificationsCardProps {
    settings: UserSettings;
    onSettingsChange: (newSettings: Partial<UserSettings>) => void;
}

export function NotificationsCard({ settings, onSettingsChange }: NotificationsCardProps) {
  return (
    <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="font-montserrat">Notification Preferences</CardTitle>
            <CardDescription className="font-pt-sans">
                Manage how you receive updates from Mentoria Onboard.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <Label htmlFor="legal-updates" className="font-medium font-pt-sans">Legal Update Alerts</Label>
                <Switch 
                    id="legal-updates" 
                    checked={settings.legalAlerts}
                    onCheckedChange={(checked) => onSettingsChange({ legalAlerts: checked })}
                />
            </div>
            <p className="text-sm text-muted-foreground -mt-4">
                Receive email notifications when Malaysian laws relevant to your company are updated.
            </p>

            <Separator />
            
            <div className="flex items-center justify-between">
                <Label htmlFor="new-track-previews" className="font-medium font-pt-sans">New Track Previews</Label>
                 <Switch 
                    id="new-track-previews" 
                    checked={settings.newTrackAlerts}
                    onCheckedChange={(checked) => onSettingsChange({ newTrackAlerts: checked })}
                />
            </div>
             <p className="text-sm text-muted-foreground -mt-4">
                Get notified when new onboarding track templates are available.
            </p>

            <Separator />
            
            <div>
                 <Label className="font-medium font-pt-sans">Email Summaries</Label>
                 <p className="text-sm text-muted-foreground mb-4">
                    Choose the frequency of your engagement summary emails.
                </p>
                <RadioGroup 
                    defaultValue={settings.digestFrequency} 
                    className="flex space-x-4"
                    onValueChange={(value) => onSettingsChange({ digestFrequency: value as 'daily' | 'weekly' | 'off' })}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="off" id="off" />
                        <Label htmlFor="off">Off</Label>
                    </div>
                </RadioGroup>
            </div>
        </CardContent>
    </Card>
  );
}
