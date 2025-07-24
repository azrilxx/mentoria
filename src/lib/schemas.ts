import {z} from 'zod';

export const SopLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  linkedLaws: z.array(z.string()),
});
export type SopLink = z.infer<typeof SopLinkSchema>;

// Quiz module schema for interactive training
export const QuizModuleSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(3).max(4),
  correctAnswer: z.string(),
  explanation: z.string(),
  sourceRef: z.string().optional(),
});
export type QuizModule = z.infer<typeof QuizModuleSchema>;

// Enhanced module schema with quiz
export const TrainingModuleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  reference: z.string().optional(),
  quiz: QuizModuleSchema.optional(),
  completed: z.boolean().default(false),
});
export type TrainingModule = z.infer<typeof TrainingModuleSchema>;

// Enhanced daily plan schema with structured modules and quizzes
export const DailyPlanSchema = z.object({
  day: z.string(),
  title: z.string(),
  modules: z.array(z.union([z.string(), TrainingModuleSchema])), // Support both old and new formats
  sops: z.array(SopLinkSchema),
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;
