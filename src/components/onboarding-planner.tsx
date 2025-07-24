"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ExternalLink, Send, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition, useRef, useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { interpretTrainingFocus } from "@/ai/flows/interpret-training-focus";
import { generateLessonPlan, DailyPlan } from "@/ai/flows/generate-lesson-plan";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  trainingFocus: z.string().min(2, {
    message: "Training focus must be at least 2 characters.",
  }),
  seniorityLevel: z.string({ required_error: "Please select a seniority level." }),
  learningScope: z.string({ required_error: "Please select a learning scope." }),
  duration: z.enum(["2", "5", "7"], { required_error: "Please select a duration." }),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

interface GeneratedPlanDetails extends OnboardingFormValues {
  plan: DailyPlan[];
  trackId: string;
}

export function OnboardingPlanner({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isClarifying, setIsClarifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [clarifiedTopic, setClarifiedTopic] = useState<string | null>(null);
  const [originalTopic, setOriginalTopic] = useState<string | null>(null);
  const [generatedPlanDetails, setGeneratedPlanDetails] = useState<GeneratedPlanDetails | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const userId = "hr_admin_user"; // Placeholder

  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trainingFocus: "",
    },
  });

  useEffect(() => {
    if (generatedPlanDetails) {
      previewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatedPlanDetails]);

  const handleFocusBlur = async () => {
    const trainingFocus = form.getValues("trainingFocus");
    if (trainingFocus && trainingFocus.split(' ').length <= 2 && trainingFocus !== clarifiedTopic) {
      setIsClarifying(true);
      setOriginalTopic(trainingFocus);
      try {
        const result = await interpretTrainingFocus({ userInput: trainingFocus });
        setSuggestedTopics(result.suggestedTopics.map(t => t.title));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get topic suggestions. Please try again.",
        });
        setIsClarifying(false);
      }
    }
  };

  const handleTopicSelection = (topic: string) => {
    form.setValue("trainingFocus", topic);
    setClarifiedTopic(topic);
    setSuggestedTopics([]);
    setIsClarifying(false);
    setOriginalTopic(null);
  };
  
  const closeClarificationDialog = () => {
    setIsClarifying(false);
    setSuggestedTopics([]);
    setOriginalTopic(null);
  }

  const onSubmit = (data: OnboardingFormValues) => {
    startTransition(async () => {
      setIsGenerating(true);
      setGeneratedPlanDetails(null);
      setIsAcknowledged(false);
      setFeedback("");
      setFeedbackSubmitted(false);
      try {
        const result = await generateLessonPlan({
          ...data,
          duration: parseInt(data.duration, 10),
          companyId,
          userId,
        });
        
        setGeneratedPlanDetails({
          ...data,
          plan: result.parsedPlan,
          trackId: result.trackId,
        });

      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error Generating Plan",
          description: "Could not generate the lesson plan. Please try again later.",
        });
      } finally {
        setIsGenerating(false);
      }
    });
  };
  
  const handleFeedbackSubmit = async () => {
      if (!generatedPlanDetails?.trackId) return;
      setIsSubmittingFeedback(true);
      try {
          // In a real app, you would call a service function like:
          // await saveEngagementLog({
          //     trackId: generatedPlanDetails.trackId,
          //     userId: userId,
          //     acknowledgedAt: new Date().toISOString(),
          //     feedback: feedback,
          //     trackTitle: generatedPlanDetails.trainingFocus,
          //     seniority: generatedPlanDetails.seniorityLevel,
          //     scope: generatedPlanDetails.learningScope,
          //     duration: parseInt(generatedPlanDetails.duration, 10)
          // });
          console.log("Submitting engagement log for trackId:", generatedPlanDetails.trackId);
          console.log({
              userId: userId,
              acknowledgedAt: new Date().toISOString(),
              feedback: feedback,
              trackTitle: generatedPlanDetails.trainingFocus,
              seniority: generatedPlanDetails.seniorityLevel,
              scope: generatedPlanDetails.learningScope,
              duration: parseInt(generatedPlanDetails.duration, 10)
          });
          
          toast({
              title: "Feedback Submitted",
              description: "Thank you for your input! HR will be notified.",
          });
          setFeedbackSubmitted(true);

      } catch (error) {
          console.error("Failed to submit feedback", error);
          toast({
              variant: "destructive",
              title: "Submission Failed",
              description: "Could not submit your feedback. Please try again.",
          });
      } finally {
          setIsSubmittingFeedback(false);
      }
  };

  const isLoading = isPending || isGenerating;
  const isSubmitDisabled = isLoading || (isClarifying && suggestedTopics.length > 0);

  return (
    <>
      <Card className="w-full shadow-lg border-2 border-border/50">
        <CardHeader>
          <CardTitle>Lesson Plan Generator</CardTitle>
          <CardDescription>
            Define a new training track for your team. Start with a topic.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="trainingFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Focus</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 'strata', 'audit', 'gst'"
                        {...field}
                        onBlur={handleFocusBlur}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="seniorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seniority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Entry">Entry</SelectItem>
                          <SelectItem value="Mid">Mid</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="learningScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Scope</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Basic Overview">Basic Overview</SelectItem>
                          <SelectItem value="Functional Mastery">Functional Mastery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-1 pt-2"
                          disabled={isLoading}
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="2" />
                            </FormControl>
                            <FormLabel className="font-normal">2 days</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="5" />
                            </FormControl>
                            <FormLabel className="font-normal">5 days</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="7" />
                            </FormControl>
                            <FormLabel className="font-normal">7 days</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitDisabled}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating plan...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <div ref={previewRef} className="w-full">
        {isLoading ? (
             <Card className="mt-8 w-full shadow-lg border-2 border-border/50">
                 <CardHeader>
                    <Skeleton className="h-8 w-3/5" />
                    <Skeleton className="h-4 w-4/5" />
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                 </CardContent>
            </Card>
        ) : generatedPlanDetails ? (
          <>
            <Card className="mt-8 w-full shadow-lg border-2 border-border/50">
              <CardHeader>
                <CardTitle>Temporary Track Preview</CardTitle>
                <CardDescription>
                  <strong>Onboarding Track: {generatedPlanDetails.trainingFocus}</strong> ({generatedPlanDetails.duration} days, {generatedPlanDetails.seniorityLevel} level, {generatedPlanDetails.learningScope})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedPlanDetails.plan.length > 0 ? (
                  <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                    {generatedPlanDetails.plan.map((item, index) => (
                      <AccordionItem value={`item-${index}`} key={item.day}>
                        <AccordionTrigger>{`${item.day}: ${item.title}`}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc space-y-2 pl-6">
                            {item.modules.map((module, moduleIndex) => (
                              <li key={moduleIndex}>{module}</li>
                            ))}
                          </ul>
                          {item.sops && item.sops.length > 0 && (
                            <>
                               <Separator className="my-4" />
                               <div className="space-y-3">
                                    <h4 className="font-semibold">Related SOPs</h4>
                                    {item.sops.map((sop, sopIndex) => (
                                       <div key={sopIndex} className="text-sm p-3 bg-muted/50 rounded-md">
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
                                                    {sop.linkedLaws.map((law, lawIndex) => (
                                                        <Badge key={lawIndex} variant="outline" className="font-normal">
                                                            Linked Law: {law}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                               </div>
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground">
                    No training modules found for the selected criteria.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 w-full shadow-lg border-2 border-border/50">
                <CardHeader>
                    <CardTitle>Plan Acknowledgment & Feedback</CardTitle>
                    <CardDescription>
                       This is a temporary preview. Review the plan and provide feedback below.
                    </CardDescription>
                </CardHeader>
                {feedbackSubmitted ? (
                    <CardContent>
                        <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 text-green-800 border border-green-200">
                           <CheckCircle className="h-6 w-6" />
                           <p className="font-medium">Thanks for confirming! HR will now review your feedback.</p>
                        </div>
                    </CardContent>
                ) : (
                    <>
                        <CardContent className="space-y-4">
                            <div className="items-top flex space-x-2">
                                <Checkbox id="terms1" checked={isAcknowledged} onCheckedChange={(checked) => setIsAcknowledged(checked as boolean)} />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="terms1"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        I have reviewed and acknowledge this onboarding plan.
                                    </label>
                                </div>
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="feedback">Optional Feedback</Label>
                                <Textarea 
                                    placeholder="Is there anything unclear or that should be improved?" 
                                    id="feedback" 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    maxLength={500}
                                />
                                 <p className="text-sm text-muted-foreground">
                                    Your feedback is valuable for refining future training.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleFeedbackSubmit} disabled={!isAcknowledged || isSubmittingFeedback}>
                                 {isSubmittingFeedback ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                 ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Submit Acknowledgment</>
                                 )}
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>
          </>
        ) : (
            <Card className="mt-8 w-full shadow-lg border-2 border-border/50">
                 <CardHeader>
                    <CardTitle>Temporary Track Preview</CardTitle>
                     <CardDescription>
                       No plan generated yet. Complete the fields and click Generate.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        Your generated plan will appear here.
                    </p>
                 </CardContent>
            </Card>
        )}
      </div>

      <AlertDialog open={isClarifying && suggestedTopics.length > 0} onOpenChange={setIsClarifying}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Did you mean...?</AlertDialogTitle>
            <AlertDialogDescription>
              You entered &quot;{originalTopic}&quot;. Please select a more specific topic:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2">
            {suggestedTopics.map((topic) => (
              <AlertDialogAction
                key={topic}
                onClick={() => handleTopicSelection(topic)}
                className="justify-start"
              >
                {topic}
              </AlertDialogAction>
            ))}
          </div>
          <AlertDialogCancel onClick={closeClarificationDialog}>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
