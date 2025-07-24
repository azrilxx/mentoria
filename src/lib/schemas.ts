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

// New schemas for Stage 16

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  subscriptionTier: z.enum(['free', 'premium', 'enterprise']),
  companyId: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const CompanySchema = z.object({
  companyId: z.string(),
  name: z.string(),
  branding: z.object({
    primaryColor: z.string().optional(),
    watermarkText: z.string().optional(),
    logoUrl: z.string().optional(),
  }),
});
export type Company = z.infer<typeof CompanySchema>;

export const PendingInviteSchema = z.object({
  companyEmail: z.string().email(),
  invitedBy: z.string(),
  timestamp: z.date(),
  status: z.enum(['pending', 'accepted', 'expired']),
});
export type PendingInvite = z.infer<typeof PendingInviteSchema>;
