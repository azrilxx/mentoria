
'use client';

import React, { useEffect, useState } from 'react';
import { getOnboardingTrackById, OnboardingTrack } from '@/services/firebase';
import { Loader2, Calendar, Clock, User, Award, Download, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

interface TrackViewProps {
  trackId: string;
}

export function TrackView({ trackId }: TrackViewProps) {
  const [track, setTrack] = useState<OnboardingTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        setIsLoading(true);
        const trackData = await getOnboardingTrackById(trackId);
        if (trackData) {
          setTrack(trackData);
        } else {
          toast({
            variant: 'destructive',
            title: 'Track Not Found',
            description: 'The requested training plan could not be found.',
          });
        }
      } catch (error) {
        console.error('Failed to fetch track:', error);
        toast({
          variant: 'destructive',
          title: 'Error Loading Plan',
          description: 'There was a problem loading the training plan.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrack();
  }, [trackId, toast]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (!track) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Track Not Found</CardTitle>
          <CardDescription>
            The training plan you are looking for does not exist or could not be loaded.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-2 border-border/50">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold">{track.clarifiedTopic}</CardTitle>
                    <CardDescription className="mt-1">
                        A {track.duration}-day onboarding program by {track.branding.companyName}.
                    </CardDescription>
                </div>
                 <Badge variant={track.status === 'published' ? 'default' : 'secondary'}>
                    {track.status.charAt(0).toUpperCase() + track.status.slice(1)}
                </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{track.duration} days</span>
                </div>
                <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>{track.seniorityLevel} Level</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{track.learningScope}</span>
                </div>
                {track.createdAt && (
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created on {new Date(track.createdAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex gap-2 mb-6">
                <Button>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                </Button>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                </Button>
            </div>
            
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                {track.plan.map((day, index) => (
                    <AccordionItem value={`item-${index}`} key={day.day}>
                        <AccordionTrigger className="text-lg font-semibold">{`${day.day}: ${day.title}`}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pl-4">
                              <ul className="list-disc space-y-2 pl-5">
                                {typeof day.modules[0] === 'string' 
                                  ? day.modules.map((module, moduleIndex) => (
                                      <li key={moduleIndex}>{module as string}</li>
                                    ))
                                  : (day.modules as any[]).map((module, moduleIndex) => (
                                      <li key={moduleIndex}>{module.title}</li>
                                  ))
                                }
                              </ul>

                              {day.sops && day.sops.length > 0 && (
                                <>
                                   <Separator />
                                   <div className="space-y-3">
                                        <h4 className="font-semibold">Related Company SOPs</h4>
                                        {day.sops.map((sop, sopIndex) => (
                                           <div key={sopIndex} className="text-sm p-3 bg-muted/50 rounded-md border-l-4 border-primary">
                                                <a
                                                    href={sop.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-primary font-semibold hover:underline"
                                                >
                                                   {sop.title} <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                                {sop.linkedLaws.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <span className="text-xs text-muted-foreground">Linked to:</span>
                                                        {sop.linkedLaws.map((law, lawIndex) => (
                                                            <Badge key={lawIndex} variant="outline" className="font-normal ml-1">
                                                                {law}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                   </div>
                                </>
                              )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
    </Card>
  );
}
