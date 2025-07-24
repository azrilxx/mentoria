'use server';

/**
 * @fileOverview A flow to interpret shorthand or vague training focus inputs from HR managers.
 *
 * - interpretTrainingFocus - A function that interprets the training focus input.
 * - InterpretTrainingFocusInput - The input type for the interpretTrainingFocus function.
 * - InterpretTrainingFocusOutput - The return type for the interpretTrainingFocus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretTrainingFocusInputSchema = z.object({
  trainingFocus: z
    .string()
    .describe('The shorthand or vague input for the training focus.'),
});
export type InterpretTrainingFocusInput = z.infer<
  typeof InterpretTrainingFocusInputSchema
>;

const InterpretTrainingFocusOutputSchema = z.object({
  suggestedTopics: z
    .array(z.string())
    .describe('A list of suggested training topics based on the input.'),
});
export type InterpretTrainingFocusOutput = z.infer<
  typeof InterpretTrainingFocusOutputSchema
>;

export async function interpretTrainingFocus(
  input: InterpretTrainingFocusInput
): Promise<InterpretTrainingFocusOutput> {
  return interpretTrainingFocusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretTrainingFocusPrompt',
  input: {schema: InterpretTrainingFocusInputSchema},
  output: {schema: InterpretTrainingFocusOutputSchema},
  prompt: `You are an AI assistant helping HR managers define training tracks.

The HR manager has provided the following shorthand or vague input for the training focus: {{{trainingFocus}}}.

Suggest a list of training topics (3-5) that are related to the input. 
Make sure the topics are relevant to the Malaysian business context.

{{#if suggestedTopics}}
  Here are some suggested topics:
  {{#each suggestedTopics}}
    - {{{this}}}
  {{/each}}
{{/if}}`,
});

const interpretTrainingFocusFlow = ai.defineFlow(
  {
    name: 'interpretTrainingFocusFlow',
    inputSchema: InterpretTrainingFocusInputSchema,
    outputSchema: InterpretTrainingFocusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
