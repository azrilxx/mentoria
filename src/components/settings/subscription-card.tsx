
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';
import { Separator } from '../ui/separator';

interface SubscriptionCardProps {
  subscriptionTier?: string;
  role?: string;
}

export function SubscriptionCard({ subscriptionTier, role }: SubscriptionCardProps) {
  const renewalDate = new Date();
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  return (
    <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="font-montserrat">Role & Subscription</CardTitle>
            <CardDescription className="font-pt-sans">
                Your current plan and access level within Desaria Group.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                <div>
                    <p className="text-sm text-muted-foreground font-pt-sans">Role</p>
                    <p className="text-lg font-semibold text-foreground font-montserrat">{role || 'Admin'}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground font-pt-sans text-right">Subscription</p>
                    <Badge className="text-base bg-accent text-accent-foreground">
                        <Star className="mr-2 h-4 w-4" />
                        {subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Premium'}
                    </Badge>
                </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-pt-sans">Seats Used</p>
                    <p className="text-xl font-semibold text-foreground font-montserrat">3 / 10</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-pt-sans">Renews On</p>
                    <p className="text-xl font-semibold text-foreground font-montserrat">
                        {renewalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-primary font-medium font-pt-sans">
                    Your Desaria Premium plan is active.
                </p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    Manage Subscription
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
