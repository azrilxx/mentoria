
'use client';

import { User } from 'firebase/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardProps {
  user: User;
  companyName: string;
}

export function ProfileCard({ user, companyName }: ProfileCardProps) {
    const { toast } = useToast();

    const userInitials = user.email
    ? user.email.split('@')[0].substring(0, 2).toUpperCase()
    : 'U';
    
    const handlePasswordChange = () => {
        // In a real app, this would open a modal or navigate to a new page
        // For now, we'll just show a toast notification
        toast({
            title: "Change Password",
            description: "Password change functionality would be implemented here.",
        });
    };

    return (
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
              <AvatarFallback className="bg-primary/30 text-primary text-3xl font-montserrat">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-montserrat text-2xl">{user.displayName || "HR Admin"}</CardTitle>
            <CardDescription className="font-pt-sans">{user.email}</CardDescription>
            <Badge variant="outline" className="w-fit mx-auto mt-2 border-accent text-accent-foreground bg-accent/10">
              {companyName}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-2 text-center">
                 <p className="text-sm font-medium text-foreground font-pt-sans">Profile Completion</p>
                 <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{width: "85%"}}></div>
                 </div>
                 <p className="text-xs text-muted-foreground">85% complete</p>
            </div>
            <Separator />
             <Button variant="outline" className="w-full" onClick={handlePasswordChange}>
                Change Password
             </Button>
          </CardContent>
        </Card>
    );
}
