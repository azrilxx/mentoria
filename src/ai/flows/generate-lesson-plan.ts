'use server';
/**
 * @fileOverview Generates a structured lesson plan with relevant training modules.
 *
 * - generateLessonPlan - A function that generates a lesson plan.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  getLawsByTags,
  getCustomModulesByTags,
  saveOnboardingTrack,
  Law,
  CustomModule,
} from '@/services/firebase';

const GenerateLessonPlanInputSchema = z.object({
  trainingFocus: z
    .string()
    .describe('The main topic or focus of the training.'),
  seniorityLevel: z
    .string()
    .describe(
      'The seniority level of the trainees (e.g., Entry, Mid, Senior).'
    ),
  learningScope: z
    .string()
    .describe(
      'The scope or depth of the training (e.g., Basic Overview, Functional Mastery).'
    ),
  duration: z
    .number()
    .describe('The duration of the training track in days (2, 5, or 7).'),
  companyId: z.string().describe('The ID of the company requesting the plan.'),
});
export type GenerateLessonPlanInput = z.infer<
  typeof GenerateLessonPlanInputSchema
>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan as a string.'),
  trackId: z.string().describe('The ID of the saved onboarding track document.'),
});
export type GenerateLessonPlanOutput = z.infer<
  typeof GenerateLessonPlanOutputSchema
>;

const LawSectionSchema = z.object({
  section: z.string(),
  title: z.string(),
  summary: z.string(),
});

const LawSchema = z.object({
  id: z.string(),
  title: z.string(),
  sections: z.array(LawSectionSchema),
});

const CustomModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

const PromptInputSchema = z.intersection(
  GenerateLessonPlanInputSchema,
  z.object({
    laws: z.array(LawSchema).optional(),
    customModules: z.array(CustomModuleSchema).optional(),
  })
);

export async function generateLessonPlan(
  input: GenerateLessonPlanInput
): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonPlanPrompt',
  input: {schema: PromptInputSchema},
  output: {
    schema: z.object({
      lessonPlan: z
        .string()
        .describe('The final, formatted lesson plan as a single string.'),
    }),
  },
  prompt: `You are an AI assistant who creates tailored corporate training plans for Malaysian companies.
Your task is to generate a {{duration}}-day onboarding track about "{{trainingFocus}}".
The audience is at the {{seniorityLevel}} level, and the goal is {{learningScope}}.

Use the following sources to build the daily modules. Prioritize official laws, then supplement with company-specific modules.

{{#if laws}}
Available Malaysian Laws:
{{#each laws}}
- Law: {{title}}
  Relevant Sections:
  {{#each sections}}
  - {{section}}: {{title}} - {{summary}}
  {{/each}}
{{/each}}
{{/if}}

{{#if customModules}}
Available Company-Specific Modules (SOPs, rules):
{{#each customModules}}
- SOP: {{title}}
  Content: {{content}}
{{/each}}
{{/if}}

INSTRUCTIONS:
1. Create a day-by-day training plan for the specified {{duration}}.
2. For each day, create a clear title (e.g., "Day 1: Introduction to the Strata Management Act").
3. For each day, list 2-4 specific modules as bullet points.
4. Each module must be derived from the provided Law Sections or Company SOPs. You can summarize or rephrase, but stick to the source material.
5. Ensure the complexity of the modules matches the {{seniorityLevel}} and {{learningScope}}.
6. The tone must be professional and suitable for a Malaysian corporate environment.
7. Output the entire plan as a single block of text, using markdown for formatting (e.g., Day 1: ..., - Module...).
`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async (input: GenerateLessonPlanInput) => {
    // For simplicity, we'll use the trainingFocus as a tag to find relevant data.
    // A real app might have a more sophisticated mapping.
    const domainTags = [input.trainingFocus.toLowerCase().replace(/ /g, '')];

    const [relevantLaws, customModules] = await Promise.all([
      getLawsByTags(domainTags),
      getCustomModulesByTags(input.companyId, domainTags),
    ]);

    const promptInput = {
      ...input,
      laws: relevantLaws.map(l => ({
        id: l.id,
        title: l.title,
        sections: l.sections.slice(0, 5), // Limit sections to keep prompt size manageable
      })),
      customModules: customModules.map(m => ({
        id: m.id,
        title: m.title,
        content: m.content,
      })),
    };

    const {output} = await prompt(promptInput);

    if (!output?.lessonPlan) {
      throw new Error('Failed to generate lesson plan content.');
    }

    const trackId = await saveOnboardingTrack({
      ...input,
      resolvedLaws: relevantLaws.map(l => l.id),
      includedCustomModules: customModules.map(m => m.id),
      generatedModules: [], // This could be populated by a more complex parsing of the output
      generatedPlanText: output.lessonPlan,
    });

    return {
      lessonPlan: output.lessonPlan,
      trackId,
    };
  }
);
