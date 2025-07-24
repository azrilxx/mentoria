"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, ExternalLink, Loader2, CheckCircle, Award } from 'lucide-react';
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
import { getOnboardingTracks, OnboardingTrack } from '@/services/firebase';
import { getCurrentUser } from '@/lib/firebaseAuth';

interface MyPlansProps {
  companyId: string;
}

export function MyPlans({ companyId }: MyPlansProps) {
  const [plans, setPlans] = useState<OnboardingTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const userId = currentUser?.uid || "hr_admin_user";

  useEffect(() => {
    loadUserPlans();
  }, [userId, companyId]);

  const loadUserPlans = async () => {
    try {
      setIsLoading(true);
      // Fetch tracks directly, can be filtered by companyId in a real backend
      const userPlans = await getOnboardingTracks(companyId);
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
    if (!trackId) {
        toast({
            variant: "destructive",
            title: "Invalid Plan ID",
            description: "This plan does not have a valid ID.",
        });
        return;
    }
    setLoadingPlanId(trackId);
    try {
      router.push(`/track/${trackId}`);
    } catch (error) {
      console.error("Failed to view plan:", error);
      toast({
        variant: "destructive",
        title: "Failed to View Plan",
        description: "Could not open the plan. Please try again.",
      });
      setLoadingPlanId(null);
    }
  };

  const getStatusChip = (status: OnboardingTrack['status']) => {
    const statusConfig = {
      draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
      published: {
        label: "Published",
        className: "bg-green-100 text-green-800 border-green-200",
      },
    };

    const config = statusConfig[status || 'draft'];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid Date';
    }
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
            Your generated training plans will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No tracks generated yet. Create your first plan in the LaunchPad!
            </p>
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
            View and manage your generated training plans ({plans.length} total)
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.clarifiedTopic}</CardTitle>
                {getStatusChip(plan.status)}
              </div>
              <CardDescription>
                {plan.seniorityLevel} level • {plan.learningScope}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(plan.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(plan.createdAt)}</span>
                </div>
                 <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By: {plan.createdBy}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPlan(plan.id!)}
                  disabled={loadingPlanId === plan.id}
                  className="flex items-center gap-2"
                >
                  {loadingPlanId === plan.id ? (
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

    