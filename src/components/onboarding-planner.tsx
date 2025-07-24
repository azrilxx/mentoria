"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition } from "react";
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
import { generateLessonPlan } from "@/ai/flows/generate-lesson-plan";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
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

const formSchema = z.object({
  trainingFocus: z.string().min(2, {
    message: "Training focus must be at least 2 characters.",
  }),
  seniorityLevel: z.string({ required_error: "Please select a seniority level." }),
  learningScope: z.string({ required_error: "Please select a learning scope." }),
  duration: z.enum(["2", "5", "7"], { required_error: "Please select a duration." }),
});

type OnboardingFormValues = z.infer<typeof formSchema>;

interface DailyPlan {
  day: string;
  title: string;
  modules: string[];
}

interface GeneratedPlanDetails extends OnboardingFormValues {
  plan: DailyPlan[];
}

export function OnboardingPlanner() {
  const [isPending, startTransition] = useTransition();
  const [isClarifying, setIsClarifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [clarifiedTopic, setClarifiedTopic] = useState<string | null>(null);
  const [originalTopic, setOriginalTopic] = useState<string | null>(null);
  const [generatedPlanDetails, setGeneratedPlanDetails] = useState<GeneratedPlanDetails | null>(null);

  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trainingFocus: "",
    },
  });

  const handleFocusBlur = async () => {
    const trainingFocus = form.getValues("trainingFocus");
    if (trainingFocus && trainingFocus.split(' ').length <= 2 && trainingFocus !== clarifiedTopic) {
      setIsClarifying(true);
      setOriginalTopic(trainingFocus);
      try {
        const result = await interpretTrainingFocus({ trainingFocus });
        setSuggestedTopics(result.suggestedTopics);
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

  const parseLessonPlan = (plan: string): DailyPlan[] => {
    const lines = plan.split('\n').filter(line => line.trim() !== '');
    const dailyPlans: DailyPlan[] = [];
    let currentPlan: DailyPlan | null = null;

    for (const line of lines) {
      const dayMatch = line.match(/^Day (\d+): (.*)/);
      if (dayMatch) {
        if (currentPlan) {
          dailyPlans.push(currentPlan);
        }
        currentPlan = {
          day: `Day ${dayMatch[1]}`,
          title: dayMatch[2],
          modules: [],
        };
      } else if (currentPlan && (line.trim().startsWith('-') || line.trim().startsWith('*'))) {
        currentPlan.modules.push(line.trim().substring(2));
      }
    }

    if (currentPlan) {
      dailyPlans.push(currentPlan);
    }
    return dailyPlans;
  };

  const onSubmit = (data: OnboardingFormValues) => {
    startTransition(async () => {
      setIsGenerating(true);
      setGeneratedPlanDetails(null);
      try {
        const result = await generateLessonPlan({
          ...data,
          duration: parseInt(data.duration, 10),
        });
        const parsedPlan = parseLessonPlan(result.lessonPlan);
        setGeneratedPlanDetails({
          ...data,
          plan: parsedPlan,
        });
      } catch (error) {
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

  const isLoading = isPending || isClarifying || isGenerating;
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
                    Generating...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="mt-8 w-full shadow-lg border-2 border-border/50">
        <CardHeader>
          <CardTitle>Temporary Track Preview</CardTitle>
          {generatedPlanDetails ? (
              <CardDescription>
                <strong>Onboarding Track: {generatedPlanDetails.trainingFocus}</strong> ({generatedPlanDetails.duration} days, {generatedPlanDetails.seniorityLevel} level, {generatedPlanDetails.learningScope})
              </CardDescription>
            ) : (
              <CardDescription>
                Review the generated plan. This is a temporary preview.
              </CardDescription>
            )}
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : generatedPlanDetails ? (
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {generatedPlanDetails.plan.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-bold">
                    {item.day}: {item.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-6">
                      {item.modules.map((module, moduleIndex) => (
                        <li key={moduleIndex}>{module}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground italic py-8">
              No plan generated yet. Complete the fields and click Generate.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={suggestedTopics.length > 0 && isClarifying}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clarify Training Focus</AlertDialogTitle>
            <AlertDialogDescription>
              You entered '{originalTopic}'. Did you mean:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col space-y-2">
            {isClarifying && !suggestedTopics.length ? (
               <div className="flex items-center justify-center p-4">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
               </div>
            ) : (
              suggestedTopics.map((topic) => (
                <AlertDialogAction key={topic} onClick={() => handleTopicSelection(topic)}>
                  {topic}
                </AlertDialogAction>
              ))
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
