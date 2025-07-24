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

const GenerateLessonPlanInputSchema = z.object({
  trainingFocus: z.string().describe('The main topic or focus of the training.'),
  seniorityLevel: z
    .string()
    .describe(
      'The seniority level of the trainees (e.g., Entry, Mid, Senior).'
    ),
  learningScope: z
    .string()
    .describe('The scope or depth of the training (e.g., Basic Overview, Functional Mastery).'),
  duration: z
    .number()
    .describe('The duration of the training track in days (2, 5, or 7).'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan in a structured format.'),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;

export async function generateLessonPlan(
  input: GenerateLessonPlanInput
): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonPlanPrompt',
  input: {schema: GenerateLessonPlanInputSchema},
  output: {schema: GenerateLessonPlanOutputSchema},
  prompt: `You are an AI assistant designed to generate structured lesson plans for corporate training.

  Based on the training focus, seniority level, learning scope, and duration provided, create a detailed lesson plan with relevant training modules.

  Training Focus: {{{trainingFocus}}}
  Seniority Level: {{{seniorityLevel}}}
  Learning Scope: {{{learningScope}}}
  Duration: {{{duration}}} days

  The lesson plan should be structured in daily modules, with each module clearly outlining the topics to be covered.
  Format the lesson plan in a readable and organized manner.
  Consider the seniority level and learning scope to tailor the content appropriately.
  The duration of the training track should be strictly adhered to.

  Ensure that the generated lesson plan is practical, relevant to the business domain, and free of academic jargon.  Use a tone that is suitable for the malaysian corporate environment.

  Output the lesson plan in plain text format.
`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
