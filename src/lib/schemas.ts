import {z} from 'zod';

export const SopLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  linkedLaws: z.array(z.string()),
});
export type SopLink = z.infer<typeof SopLinkSchema>;

export const DailyPlanSchema = z.object({
  day: z.string(),
  title: z.string(),
  modules: z.array(z.string()),
  sops: z.array(SopLinkSchema),
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;
