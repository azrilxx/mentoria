'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Building, Scale, Clock, Users, BookOpen } from 'lucide-react';

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
  // Parse lesson plan content
  const parsedContent = React.useMemo(() => {
    const lines = plan.lessonPlan.split('\n');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-gray-900">
                {plan.clarifiedTopic}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {plan.duration}-day training program for {plan.seniorityLevel} level
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              {plan.companyName}
            </Badge>
          </div>
          
          <div className="flex gap-4 text-sm text-gray-600 mt-4">
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
            <Button onClick={onStartTraining} className="bg-blue-600 hover:bg-blue-700">
              Start Training
            </Button>
            <Button variant="outline" onClick={onDownloadPlan}>
              Download Plan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Legal Context Section */}
      {plan.legalReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Malaysian Legal Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.legalReferences.map((ref, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{ref.lawTitle}</h4>
                    <Badge variant="secondary">
                      {Math.round(ref.relevanceScore * 100)}% relevant
                    </Badge>
                  </div>
                  <a 
                    href={ref.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
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
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-green-600" />
              {plan.companyName} Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.companyPolicies.map((policy, index) => (
                <Alert key={index} className="border-green-200 bg-green-50">
                  <AlertDescription>
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {policy.policyType.charAt(0).toUpperCase() + policy.policyType.slice(1)} Policy
                      </Badge>
                      <p className="text-gray-700">{policy.policyText}</p>
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
          <CardTitle>Training Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {parsedContent.map((day, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {day.title}
                  </h3>
                  <div className="space-y-2 ml-4">
                    {day.content.map((item, itemIndex) => {
                      // Check if this is a company policy callout
                      if (item.startsWith('>')) {
                        return (
                          <Alert key={itemIndex} className="border-amber-200 bg-amber-50 my-3">
                            <AlertDescription className="text-amber-800">
                              {item.substring(1).trim()}
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      
                      // Check if this is a legal reference
                      if (item.includes('Legal Reference:')) {
                        return (
                          <div key={itemIndex} className="text-sm text-blue-600 bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                            {item}
                          </div>
                        );
                      }
                      
                      return (
                        <div key={itemIndex} className="text-gray-700">
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
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
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
  );
}

export default EnhancedTrainingPlanDisplay;