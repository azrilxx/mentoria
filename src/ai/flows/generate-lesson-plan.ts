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
  getSopsByTags,
  saveOnboardingTrack,
  getLawsByIds,
} from '@/services/firebase';
import { DailyPlanSchema, SopLinkSchema } from '@/lib/schemas';
import type { DailyPlan, SopLink } from '@/lib/schemas';


export { type DailyPlan, type SopLink };


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
  userId: z.string().describe('The ID of the user creating the plan.'),
});
export type GenerateLessonPlanInput = z.infer<
  typeof GenerateLessonPlanInputSchema
>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan as a string.'),
  trackId: z.string().describe('The ID of the saved onboarding track document.'),
  parsedPlan: z.array(DailyPlanSchema).describe('The parsed lesson plan structure.'),
});
export type GenerateLessonPlanOutput = z.infer<
  typeof GenerateLessonPlanOutputSchema
>;

const PromptInputSchema = z.object({
  trainingFocus: z.string(),
  seniorityLevel: z.string(),
  learningScope: z.string(),
  duration: z.number(),
  laws: z.string().optional(),
  customModules: z.string().optional(),
  sops: z.string().optional(),
});

function parseLessonPlan(planText: string): DailyPlan[] {
  if (!planText) return [];

  const dailyPlans: DailyPlan[] = [];
  const dayBlocks = planText.split(/Day \d+:/).filter(Boolean);
  const dayTitles = planText.match(/Day \d+:.*(?:\r\n|\r|\n)/g) || [];

  dayBlocks.forEach((block, index) => {
      const titleMatch = dayTitles[index]?.trim().match(/Day (\d+): (.*)/i);
      if (!titleMatch) return;

      const dayNumber = titleMatch[1];
      const dayTitle = titleMatch[2];
      
      const contentAndSops = block.split('Related SOPs:');
      const contentBlock = contentAndSops[0];
      const sopBlock = contentAndSops[1] || '';

      const modules = contentBlock.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim());

      const sops: SopLink[] = [];
      const sopEntries = sopBlock.split('- SOP Document:').filter(s => s.trim());
      
      sopEntries.forEach(entry => {
          const sopMatch = entry.match(/(.*?)\s\(link: (.*?)\)/);
          if (sopMatch) {
              const title = sopMatch[1].trim();
              const url = sopMatch[2].trim();
              const linkedLaws = (entry.match(/- Linked Law: (.*)/g) || [])
                  .map(line => line.replace('- Linked Law: ', '').trim());
              sops.push({ title, url, linkedLaws });
          }
      });

      if (modules.length > 0) {
          dailyPlans.push({
              day: `Day ${dayNumber}`,
              title: dayTitle,
              modules: modules,
              sops: sops
          });
      }
  });

  return dailyPlans;
};


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

Use the following sources to build the daily modules. Prioritize official laws, then supplement with company-specific modules and SOPs.

{{#if laws}}
Available Malaysian Laws:
{{{laws}}}
{{/if}}

{{#if customModules}}
Available Company-Specific Training Modules:
{{{customModules}}}
{{/if}}

{{#if sops}}
Available Company-Specific SOPs (Standard Operating Procedures):
{{{sops}}}
{{/if}}

INSTRUCTIONS:
1. Create a day-by-day training plan for the specified {{duration}}.
2. For each day, create a clear title (e.g., "Day 1: Introduction to the Strata Management Act").
3. For each day, list 2-4 specific modules as bullet points. Each module MUST start with '- '.
4. Each module must be derived from the provided Law Sections or Company Modules. You can summarize or rephrase, but stick to the source material.
5. After listing the day's modules, if there are relevant Company SOPs, add a section titled "Related SOPs:".
6. Under "Related SOPs:", list the relevant SOP document. For each SOP, also list any of its linked laws. Format it like this:
   - SOP Document: [SOP Filename] (link: [SOP URL])
     - Linked Law: [Title of Linked Law]
7. Ensure the complexity of the modules matches the {{seniorityLevel}} and {{learningScope}}.
8. The tone must be professional and suitable for a Malaysian corporate environment.
9. Output the entire plan as a single block of text, using markdown for formatting (e.g., Day 1: ..., - Module...).
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

    const [relevantLaws, customModules, relevantSops] = await Promise.all([
      getLawsByTags(domainTags),
      getCustomModulesByTags(input.companyId, domainTags),
      getSopsByTags(input.companyId, domainTags),
    ]);
    
    const lawsText = relevantLaws
      .map(
        l =>
          `- Law: ${l.title}\n  Relevant Sections:\n` +
          l.sections
            .slice(0, 5) // Limit for brevity in prompt
            .map(s => `  - Section ${s.section} (${s.title}): ${s.summary}`)
            .join('\n')
      )
      .join('\n');

    const customModulesText = customModules
      .map(m => `- Module: ${m.title}\n  Content: ${m.content}`)
      .join('\n');

    // Enhance SOPs with their linked law titles for the prompt
    const sopsWithLinkedLaws = await Promise.all(
        relevantSops.map(async sop => {
            const linkedLaws = await getLawsByIds(sop.linkedLaws || []);
            return {
                ...sop,
                linkedLawTitles: linkedLaws.map(l => l.title),
            };
        })
    );
      
    const sopsText = sopsWithLinkedLaws
      .map(s => {
        const sopLine = `- SOP Document: ${s.fileName} (link: ${s.fileUrl})`;
        const lawLines = s.linkedLawTitles.map(title => `  - Linked Law: ${title}`).join('\n');
        return `${sopLine}\n${lawLines}`;
      })
      .join('\n\n');

    const promptInput = {
      trainingFocus: input.trainingFocus,
      seniorityLevel: input.seniorityLevel,
      learningScope: input.learningScope,
      duration: input.duration,
      laws: lawsText,
      customModules: customModulesText,
      sops: sopsText,
    };

    const {output} = await prompt(promptInput);

    if (!output?.lessonPlan) {
      throw new Error('Failed to generate lesson plan content.');
    }
    
    const parsedPlan = parseLessonPlan(output.lessonPlan);
    
    const trackId = await saveOnboardingTrack({
      trainingFocus: input.trainingFocus,
      clarifiedTopic: input.trainingFocus,
      duration: input.duration,
      seniorityLevel: input.seniorityLevel,
      learningScope: input.learningScope,
      companyId: input.companyId,
      createdBy: input.userId,
      plan: parsedPlan,
      status: 'draft',
      branding: {
        companyName: "Desaria Group", // Placeholder
      }
    });

    return {
      lessonPlan: output.lessonPlan,
      trackId,
      parsedPlan,
    };
  }
);
