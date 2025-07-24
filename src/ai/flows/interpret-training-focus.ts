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
import {getLawsByTags, getLegalTrainingMapping} from '@/services/firebase';

const InterpretTrainingFocusInputSchema = z.object({
  userInput: z
    .string()
    .describe('The shorthand or vague input for the training focus.'),
});
export type InterpretTrainingFocusInput = z.infer<
  typeof InterpretTrainingFocusInputSchema
>;

const SuggestedTopicSchema = z.object({
  title: z.string(),
  lawId: z.string().optional(),
  domainTags: z.array(z.string()).optional(),
});

const InterpretTrainingFocusOutputSchema = z.object({
  suggestedTopics: z
    .array(SuggestedTopicSchema)
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

const interpretTrainingFocusFlow = ai.defineFlow(
  {
    name: 'interpretTrainingFocusFlow',
    inputSchema: InterpretTrainingFocusInputSchema,
    outputSchema: InterpretTrainingFocusOutputSchema,
  },
  async ({userInput}) => {
    const mapping = await getLegalTrainingMapping(userInput);

    if (mapping && mapping.resolvedLawIds.length > 0) {
      const laws = await Promise.all(
        mapping.resolvedLawIds.map(async lawId => {
          // This is inefficient if laws were a real DB, but fine for demo.
          // A real implementation would query by ID.
          const allLaws = await getLawsByTags([]);
          return allLaws.find(l => l.id === lawId);
        })
      );

      const suggestedTopics = laws
        .filter(law => !!law)
        .map(law => ({
          title: law!.title,
          lawId: law!.id,
          domainTags: law!.domainTags,
        }));

      // Also suggest modules from the mapping
      mapping.recommendedModules.forEach(moduleTitle => {
        if (!suggestedTopics.some(st => st.title === moduleTitle)) {
            suggestedTopics.push({ title: moduleTitle });
        }
      });


      return {suggestedTopics};
    }

    // Fallback to generative model if no mapping found
    const {output} = await ai.generate({
      prompt: `You are an AI assistant helping HR managers define training tracks.
        The HR manager has provided the following shorthand or vague input for the training focus: "${userInput}".
        Suggest a list of 3-5 more specific, professional training topics related to this input, suitable for a Malaysian corporate environment.
        Return the result as a JSON object with a key "suggestedTopics" which is an array of objects, each with a "title" field.`,
      output: {
        schema: z.object({
            suggestedTopics: z.array(z.object({title: z.string()})),
        })
      }
    });
    
    return output || {suggestedTopics: []};
  }
);
