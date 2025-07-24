"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, ExternalLink, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ProgressTrackingService } from "@/services/progress-tracking";
import { UserProgress } from "@/services/firebase";
import { getCurrentUser } from "@/lib/firebaseAuth";

interface MyPlansProps {
  companyId: string;
}

export function MyPlans({ companyId }: MyPlansProps) {
  const [plans, setPlans] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid || "hr_admin_user";

  useEffect(() => {
    loadUserPlans();
  }, [userId]);

  const loadUserPlans = async () => {
    try {
      setIsLoading(true);
      const userPlans = await ProgressTrackingService.getUserProgressList(userId);
      setPlans(userPlans);
    } catch (error) {
      console.error("Failed to load user plans:", error);
      toast({
        variant: "destructive",
        title: "Failed to Load Plans",
        description: "Could not load your training plans. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlan = async (trackId: string) => {
    setLoadingPlanId(trackId);
    try {
      // Update lastViewed timestamp
      await ProgressTrackingService.updateLastViewed(userId, trackId);
      
      // Refresh the plans list to show updated lastViewed time
      await loadUserPlans();
      
      // Navigate to view the plan (you can customize this route)
      // For now, we'll just show a toast
      toast({
        title: "Plan Viewed",
        description: "Plan view updated. In a full implementation, this would navigate to the plan details.",
      });
    } catch (error) {
      console.error("Failed to view plan:", error);
      toast({
        variant: "destructive",
        title: "Failed to View Plan",
        description: "Could not open the plan. Please try again.",
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getStatusChip = (status: UserProgress['status']) => {
    const statusConfig = {
      draft: {
        label: ProgressTrackingService.getStatusLabel(status),
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
      confirmed: {
        label: ProgressTrackingService.getStatusLabel(status),
        className: "bg-green-100 text-green-800 border-green-200",
      },
      archived: {
        label: ProgressTrackingService.getStatusLabel(status),
        className: "bg-red-100 text-red-800 border-red-200",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (days: number) => {
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Plans</CardTitle>
          <CardDescription>
            Your training plans will appear here once you generate them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No training plans found. Generate your first plan to get started!
            </p>
            <Button 
              onClick={() => {
                // This would typically navigate to the Generate Plan tab
                // For now, we'll just show a message
                toast({
                  title: "Navigate to Generate Plan",
                  description: "In a full implementation, this would switch to the Generate Plan tab.",
                });
              }}
              className="bg-[#74b49b] hover:bg-[#5a9b84] text-white"
            >
              Generate Your First Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Plans</h2>
          <p className="text-muted-foreground">
            View and manage your training plans ({plans.length} total)
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.topic}</CardTitle>
                {getStatusChip(plan.status)}
              </div>
              <CardDescription>
                {plan.seniority} level • {plan.scope}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(plan.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created {formatDate(plan.generatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Last viewed {formatDate(plan.lastViewed)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.confirmedAt && (
                    <span className="text-green-600 text-xs">
                      Confirmed {formatDate(plan.confirmedAt)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPlan(plan.trackId)}
                  disabled={loadingPlanId === plan.trackId}
                  className="flex items-center gap-2"
                >
                  {loadingPlanId === plan.trackId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      View Plan
                    </>
                  )}
                </Button>
                
                {plan.status === 'draft' && (
                  <Button
                    size="sm"
                    className="bg-[#74b49b] hover:bg-[#5a9b84] text-white"
                    onClick={async () => {
                      try {
                        await ProgressTrackingService.confirmPlan(userId, plan.trackId);
                        await loadUserPlans();
                        toast({
                          title: "Plan Confirmed",
                          description: "Your training plan has been confirmed.",
                        });
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Failed to Confirm Plan",
                          description: "Could not confirm the plan. Please try again.",
                        });
                      }
                    }}
                  >
                    Confirm Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}