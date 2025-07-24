'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Building, Scale, Clock, Users, BookOpen, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/firebaseAuth';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

// Enhanced training plan types
interface LegalReference {
  lawTitle: string;
  sourceUrl: string;
  relevanceScore: number;
}

interface CompanyPolicy {
  policyType: string;
  policyText: string;
}

interface EnhancedTrainingPlan {
  id: string;
  trainingFocus: string;
  clarifiedTopic: string;
  duration: number;
  seniorityLevel: string;
  learningScope: string;
  companyName: string;
  lessonPlan: string;
  legalReferences: LegalReference[];
  companyPolicies: CompanyPolicy[];
  createdAt: string;
}

interface EnhancedTrainingPlanProps {
  plan: EnhancedTrainingPlan;
  onStartTraining?: () => void;
  onDownloadPlan?: () => void;
}

/**
 * Enhanced Training Plan Component with Legal and Company Context
 */
export function EnhancedTrainingPlanDisplay({ 
  plan, 
  onStartTraining, 
  onDownloadPlan 
}: EnhancedTrainingPlanProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<'free' | 'premium' | 'enterprise' | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserSubscriptionTier(user.subscriptionTier || 'free');
      // For demonstration, let's say only 'premium' and 'enterprise' can view plans fully
      // If user is 'free', show the locked modal
      if (user.subscriptionTier === 'free') {
        setShowLockedModal(true);
      }
    } else {
      // If no user, redirect to login or show locked content
      router.push('/login');
    }
  }, [router]);

  // Parse lesson plan content
  const parsedContent = React.useMemo(() => {
    const lines = plan.lessonPlan.split('
');
    const days: { title: string; content: string[] }[] = [];
    let currentDay: { title: string; content: string[] } | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/^Day \d+:/)) {
        if (currentDay) {
          days.push(currentDay);
        }
        currentDay = { title: trimmedLine, content: [] };
      } else if (trimmedLine && currentDay) {
        currentDay.content.push(trimmedLine);
      }
    }
    
    if (currentDay) {
      days.push(currentDay);
    }
    
    return days;
  }, [plan.lessonPlan]);

  const isPremiumUser = userSubscriptionTier === 'premium' || userSubscriptionTier === 'enterprise';

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative overflow-hidden">
      {/* Watermark */}
      {isPremiumUser && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-gray-200 opacity-75 transform rotate-[-45deg] text-5xl font-extrabold select-none" style={{ fontSize: 'min(10vw, 96px)', whiteSpace: 'nowrap' }}>
            Mentoria — Internal Use Only
          </span>
        </div>
      )}

      {/* Content blurred/overlayed if locked */}
      <div className={isPremiumUser ? "" : "blur-sm grayscale pointer-events-none relative z-10"}>
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-foreground font-montserrat">
                  {plan.clarifiedTopic}
                </CardTitle>
                <p className="text-muted-foreground mt-1 font-pt-sans">
                  {plan.duration}-day training program for {plan.seniorityLevel} level
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1 bg-secondary text-secondary-foreground font-pt-sans">
                <Building className="w-3 h-3" />
                {plan.companyName}
              </Badge>
            </div>
            
            <div className="flex gap-4 text-sm text-muted-foreground mt-4 font-pt-sans">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {plan.duration} days
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {plan.seniorityLevel}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {plan.learningScope}
              </div>
              <div className="flex items-center gap-1">
                <Scale className="w-4 h-4" />
                {plan.legalReferences.length} legal references
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={onStartTraining} className="bg-primary hover:bg-primary/90 font-montserrat">
                Start Training
              </Button>
              <Button variant="outline" onClick={onDownloadPlan} className="border-primary text-primary hover:bg-primary/10 font-montserrat">
                Download Plan
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Legal Context Section */}
        {plan.legalReferences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-montserrat">
                <Scale className="w-5 h-5 text-primary" />
                Malaysian Legal Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.legalReferences.map((ref, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-foreground font-pt-sans">{ref.lawTitle}</h4>
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-pt-sans">
                        {Math.round(ref.relevanceScore * 100)}% relevant
                      </Badge>
                    </div>
                    <a 
                      href={ref.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/90 text-sm flex items-center gap-1 mt-1 font-pt-sans"
                    >
                      View full text <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Policies Section */}
        {plan.companyPolicies && plan.companyPolicies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-montserrat">
                <Building className="w-5 h-5 text-primary" />
                {plan.companyName} Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.companyPolicies.map((policy, index) => (
                  <Alert key={index} className="border-l-4 border-accent bg-accent/10">
                    <AlertDescription className="text-foreground font-pt-sans">
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-accent-foreground border-accent bg-accent/20 font-pt-sans">
                          {policy.policyType.charAt(0).toUpperCase() + policy.policyType.slice(1)} Policy
                        </Badge>
                        <p className="text-foreground">{policy.policyText}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Content Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground font-montserrat">Training Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-6">
                {parsedContent.map((day, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-foreground mb-3 font-montserrat">
                      {day.title}
                    </h3>
                    <div className="space-y-2 ml-4">
                      {day.content.map((item, itemIndex) => {
                        // Check if this is a company policy callout
                        if (item.startsWith('>')) {
                          return (
                            <Alert key={itemIndex} className="border-l-4 border-secondary bg-secondary/10 my-3">
                              <AlertDescription className="text-foreground font-pt-sans">
                                {item.substring(1).trim()}
                              </AlertDescription>
                            </Alert>
                          );
                        }
                        
                        // Check if this is a legal reference
                        if (item.includes('Legal Reference:')) {
                          return (
                            <div key={itemIndex} className="text-sm text-primary bg-primary/10 p-2 rounded border-l-4 border-primary font-pt-sans">
                              {item}
                            </div>
                          );
                        }
                        
                        return (
                          <div key={itemIndex} className="text-foreground font-pt-sans">
                            {item}
                        </div>
                      );
                    })}
                    </div>
                    {index < parsedContent.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Compliance Footer */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground font-pt-sans">
              <p>
                This training plan incorporates current Malaysian legal requirements and{' '}
                {plan.companyName} specific policies. Content is automatically updated to reflect 
                the latest regulatory changes.
              </p>
              <p className="mt-2 text-xs">
                Generated: {new Date(plan.createdAt).toLocaleDateString()} • 
                Legal accuracy verified against official sources
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locked Content Modal */}
      <AlertDialog open={showLockedModal} onOpenChange={setShowLockedModal}>
        <AlertDialogContent className="font-montserrat">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2"><Lock className="w-6 h-6" /> Plan Locked</AlertDialogTitle>
            <AlertDialogDescription className="font-pt-sans">
              This feature is exclusive to Premium and Enterprise subscribers.
              Please upgrade your subscription or contact your administrator for access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/dashboard')} className="bg-primary hover:bg-primary/90">
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EnhancedTrainingPlanDisplay;