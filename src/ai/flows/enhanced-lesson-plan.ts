'use server';

/**
 * @fileOverview Enhanced lesson plan generation with legal library and company metadata integration
 * 
 * This flow integrates:
 * - Legal library documents for Malaysian law references
 * - Company metadata for HR policy personalization
 * - Improved topic resolution with legal context
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
  saveOnboardingTrack,
  searchLegalLibrary,
  getHRRelevantLegalDocs,
  getAllLegalDocuments
} from '@/services/firebase';
import { 
  getCompanyMetadata,
  contextualizeWithCompanyPolicy 
} from '@/services/company-metadata';
import { DailyPlanSchema, TrainingModuleSchema, QuizModuleSchema } from '@/lib/schemas';
import type { DailyPlan, TrainingModule, QuizModule } from '@/lib/schemas';
import { generateQuizForModule, enhanceModuleWithQuiz, validateQuiz } from '@/services/quiz-generator';

// Enhanced input schema with legal and company integration
const EnhancedGenerateLessonPlanInputSchema = z.object({
  trainingFocus: z.string().describe('The main topic or focus of the training'),
  seniorityLevel: z.enum(['Entry', 'Mid', 'Senior']).describe('The seniority level of trainees'),
  learningScope: z.enum(['Basic Overview', 'Functional Mastery']).describe('The scope or depth of training'),
  duration: z.number().min(2).max(7).describe('Duration in days (2, 5, or 7)'),
  companyId: z.string().optional().describe('Company ID for policy personalization'),
  userId: z.string().describe('User ID creating the plan'),
  planParser: z.function().args(z.string()).returns(z.array(DailyPlanSchema)),
});

export type EnhancedGenerateLessonPlanInput = z.infer<typeof EnhancedGenerateLessonPlanInputSchema>;

// Enhanced output schema with legal and company references
const EnhancedGenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan as formatted text'),
  trackId: z.string().describe('The saved onboarding track ID'),
  parsedPlan: z.array(DailyPlanSchema).describe('Structured lesson plan data'),
  legalReferences: z.array(z.object({
    lawTitle: z.string(),
    sourceUrl: z.string(),
    relevanceScore: z.number()
  })).describe('Referenced Malaysian laws'),
  companyPolicies: z.array(z.object({
    policyType: z.string(),
    policyText: z.string()
  })).optional().describe('Applied company policies'),
  clarifiedTopic: z.string().describe('Resolved/clarified training topic'),
});

export type EnhancedGenerateLessonPlanOutput = z.infer<typeof EnhancedGenerateLessonPlanOutputSchema>;

// Unresolved topics logging
const UNRESOLVED_TOPICS: { topic: string; timestamp: string; reason: string }[] = [];

/**
 * Resolves vague training topics using legal library context
 */
async function resolveTrainingTopic(originalTopic: string): Promise<{
  clarifiedTopic: string;
  suggestedLaws: any[];
  confidence: number;
}> {
  console.log(`🔍 Resolving training topic: "${originalTopic}"`);
  
  // Search legal library for relevant documents
  const relevantDocs = await searchLegalLibrary(originalTopic);
  
  if (relevantDocs.length === 0) {
    // Fallback to HR-relevant documents
    const hrDocs = await getHRRelevantLegalDocs();
    const generalMatch = hrDocs.filter(doc => 
      doc.keywords.some(keyword => 
        originalTopic.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (generalMatch.length === 0) {
      return {
        clarifiedTopic: originalTopic,
        suggestedLaws: [],
        confidence: 0
      };
    }
    
    return {
      clarifiedTopic: generalMatch[0].category,
      suggestedLaws: generalMatch.slice(0, 3),
      confidence: 0.5
    };
  }
  
  // Analyze top matches for topic clarification
  const topMatch = relevantDocs[0];
  const clarifiedTopic = topMatch.category || originalTopic;
  
  return {
    clarifiedTopic,
    suggestedLaws: relevantDocs.slice(0, 3),
    confidence: relevantDocs.length >= 2 ? 0.9 : 0.7
  };
}

/**
 * Fetches relevant legal content for training topic
 */
async function fetchLegalContent(trainingFocus: string): Promise<{
  laws: any[];
  legalText: string;
  references: any[];
}> {
  console.log(`📚 Fetching legal content for: "${trainingFocus}"`);
  
  // Search for relevant legal documents
  const relevantDocs = await searchLegalLibrary(trainingFocus);
  
  // Filter for onboarding-relevant and clarification-ready docs
  const prioritizedDocs = relevantDocs.filter(doc => 
    doc.onboardingRelevance || doc.useInClarification
  );
  
  const finalDocs = prioritizedDocs.length > 0 ? prioritizedDocs : relevantDocs.slice(0, 3);
  
  // Format legal text for prompt
  const legalText = finalDocs.map(doc => `
**${doc.lawTitle}**
Category: ${doc.category}
Key Provisions: ${doc.excerpt}
Keywords: ${doc.keywords.slice(0, 5).join(', ')}
Source: ${doc.sourceUrl}
`).join('\n');

  // Create reference objects
  const references = finalDocs.map(doc => ({
    lawTitle: doc.lawTitle,
    sourceUrl: doc.sourceUrl,
    relevanceScore: doc.onboardingRelevance ? 1.0 : 0.7
  }));

  return {
    laws: finalDocs,
    legalText,
    references
  };
}

/**
 * Fetches company-specific policies and context
 */
async function fetchCompanyContext(companyId: string, trainingFocus: string): Promise<{
  companyName: string;
  policies: any[];
  contextualizedContent: string;
}> {
  console.log(`🏢 Fetching company context for: ${companyId}`);
  
  const companyData = await getCompanyMetadata(companyId);
  
  if (!companyData) {
    return {
      companyName: 'Unknown Company',
      policies: [],
      contextualizedContent: ''
    };
  }
  
  // Get relevant policies based on training focus
  const relevantPolicies: any[] = [];
  const focusLower = trainingFocus.toLowerCase();
  
  if (focusLower.includes('leave') || focusLower.includes('vacation')) {
    relevantPolicies.push({ policyType: 'leave', policyText: companyData.policies.leave });
  }
  
  if (focusLower.includes('probation') || focusLower.includes('trial')) {
    relevantPolicies.push({ policyType: 'probation', policyText: companyData.policies.probation });
  }
  
  if (focusLower.includes('termination') || focusLower.includes('dismissal')) {
    relevantPolicies.push({ policyType: 'termination', policyText: companyData.policies.termination });
  }
  
  if (focusLower.includes('training') || focusLower.includes('induction')) {
    relevantPolicies.push({ policyType: 'training', policyText: companyData.policies.training });
  }
  
  if (focusLower.includes('overtime') || focusLower.includes('hours')) {
    relevantPolicies.push({ policyType: 'overtime', policyText: companyData.policies.overtime });
  }
  
  if (focusLower.includes('conduct') || focusLower.includes('harassment') || focusLower.includes('ethics')) {
    relevantPolicies.push({ policyType: 'conduct', policyText: companyData.policies.conduct });
  }
  
  // If no specific policies match, include all policies for comprehensive context
  if (relevantPolicies.length === 0) {
    Object.entries(companyData.policies).forEach(([type, text]) => {
      relevantPolicies.push({ policyType: type, policyText: text });
    });
  }
  
  // Generate contextualized content
  const contextualizedContent = await contextualizeWithCompanyPolicy(
    companyId, 
    trainingFocus, 
    `Training focus: ${trainingFocus}`
  );
  
  return {
    companyName: companyData.companyName,
    policies: relevantPolicies,
    contextualizedContent
  };
}

/**
 * Enhanced lesson plan generation prompt
 */
const enhancedPrompt = ai.definePrompt({
  name: 'enhancedLessonPlanPrompt',
  input: {
    schema: z.object({
      trainingFocus: z.string(),
      clarifiedTopic: z.string(),
      seniorityLevel: z.string(),
      learningScope: z.string(),
      duration: z.number(),
      legalContent: z.string(),
      companyContext: z.string(),
      companyName: z.string(),
    })
  },
  output: {
    schema: z.object({
      lessonPlan: z.string().describe('Complete formatted lesson plan')
    })
  },
  prompt: `You are an expert Malaysian HR training specialist creating personalized onboarding plans.

**Training Request:**
- Original Topic: "{{trainingFocus}}"
- Clarified Topic: "{{clarifiedTopic}}"
- Duration: {{duration}} days
- Audience: {{seniorityLevel}} level employees
- Scope: {{learningScope}}
- Company: {{companyName}}

**Malaysian Legal Framework:**
{{legalContent}}

**Company-Specific Policies:**
{{companyContext}}

**INSTRUCTIONS:**
1. Create a {{duration}}-day comprehensive training plan
2. Each day should have a clear title (e.g., "Day 1: Malaysian Employment Law Fundamentals")
3. Each day should contain 2-4 specific learning modules starting with '- '
4. Integrate BOTH legal requirements AND company policies in each relevant module
5. Include legal references from the provided Malaysian laws
6. Add company policy callouts in shaded boxes using this format:
   > **{{companyName}} Policy:** [Policy text here]
7. Ensure content matches {{seniorityLevel}} level and {{learningScope}} depth
8. Use professional tone suitable for Malaysian corporate environment
9. End each day with "Legal Reference: [Law source URL]" when applicable
10. Include practical scenarios and compliance checkpoints

**Output Format:**
Use markdown with clear day-by-day structure, bullet points for modules, and quote blocks for company policies.
`
});

/**
 * Enhances lesson plan content with interactive quizzes
 */
async function enhanceLessonPlanWithQuizzes(
  lessonPlan: string,
  legalContent: any[],
  companyContext: any,
  companyName: string
): Promise<{ enhancedPlan: string; quizModules: QuizModule[] }> {
  console.log('📝 Enhancing lesson plan with interactive quizzes...');
  
  const lines = lessonPlan.split('\n');
  const enhancedLines: string[] = [];
  const quizModules: QuizModule[] = [];
  let currentModule: { title: string; summary: string; reference?: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    enhancedLines.push(lines[i]);
    
    // Detect module lines (bullet points)
    if (line.startsWith('- ')) {
      const moduleTitle = line.substring(2).trim();
      
      // Look for the next few lines to build module summary
      let moduleSummary = '';
      let j = i + 1;
      while (j < lines.length && j < i + 3) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('- ') && !nextLine.startsWith('#') && !nextLine.startsWith('>')) {
          moduleSummary += nextLine + ' ';
        }
        j++;
      }
      
      if (moduleSummary.length < 20) {
        moduleSummary = `Training module covering ${moduleTitle.toLowerCase()} concepts and practical applications.`;
      }
      
      // Determine reference source
      let reference = 'general_training';
      if (legalContent.length > 0) {
        reference = legalContent[0].sourceUrl;
      }
      if (companyContext && (moduleTitle.toLowerCase().includes('policy') || moduleTitle.toLowerCase().includes(companyName.toLowerCase()))) {
        reference = `companyMetadata/${companyContext.companyId || 'company'}`;
      }
      
      currentModule = {
        title: moduleTitle,
        summary: moduleSummary.trim(),
        reference
      };
      
      // Generate quiz for this module
      const quiz = generateQuizForModule(
        currentModule,
        legalContent,
        companyContext
      );
      
      if (quiz) {
        const validation = validateQuiz(quiz);
        if (validation.isValid) {
          quizModules.push(quiz);
          
          // Add quiz to the lesson plan
          enhancedLines.push('');
          enhancedLines.push('  **📝 Quick Knowledge Check:**');
          enhancedLines.push(`  *${quiz.question}*`);
          enhancedLines.push('  ```');
          quiz.options.forEach((option, idx) => {
            const marker = option === quiz.correctAnswer ? '✅' : '  ';
            enhancedLines.push(`  ${String.fromCharCode(65 + idx)}. ${option} ${marker}`);
          });
          enhancedLines.push('  ```');
          enhancedLines.push(`  💡 **Explanation:** ${quiz.explanation}`);
          enhancedLines.push('');
        } else {
          console.warn(`⚠️ Quiz validation failed for "${moduleTitle}":`, validation.issues);
        }
      }
    }
  }
  
  return {
    enhancedPlan: enhancedLines.join('\n'),
    quizModules
  };
}

/**
 * Main enhanced lesson plan generation flow
 */
export const generateEnhancedLessonPlan = ai.defineFlow({
  name: 'generateEnhancedLessonPlan',
  inputSchema: EnhancedGenerateLessonPlanInputSchema,
  outputSchema: EnhancedGenerateLessonPlanOutputSchema,
}, async (input: EnhancedGenerateLessonPlanInput): Promise<EnhancedGenerateLessonPlanOutput> => {
  console.log('🚀 Starting enhanced lesson plan generation...');
  
  try {
    // Step 1: Resolve and clarify training topic
    const topicResolution = await resolveTrainingTopic(input.trainingFocus);
    
    if (topicResolution.confidence === 0) {
      // Log unresolved topic
      UNRESOLVED_TOPICS.push({
        topic: input.trainingFocus,
        timestamp: new Date().toISOString(),
        reason: 'No matching legal content or company policies found'
      });
      console.warn(`⚠️ Unresolved topic logged: ${input.trainingFocus}`);
    }
    
    // Step 2: Fetch legal content
    const { legalText, references } = await fetchLegalContent(topicResolution.clarifiedTopic);
    
    // Step 3: Fetch company context (if provided)
    let companyContext = '';
    let companyPolicies: any[] = [];
    let companyName = 'Your Company';
    
    if (input.companyId) {
      const context = await fetchCompanyContext(input.companyId, topicResolution.clarifiedTopic);
      companyContext = context.contextualizedContent;
      companyPolicies = context.policies;
      companyName = context.companyName;
    }
    
    // Safety check: Ensure we have either legal content or company policies
    if (!legalText && !companyContext) {
      UNRESOLVED_TOPICS.push({
        topic: input.trainingFocus,
        timestamp: new Date().toISOString(),
        reason: 'Neither legal content nor company policies available'
      });
      
      throw new Error(`Cannot generate training plan: No legal content or company policies found for "${input.trainingFocus}"`);
    }
    
    // Step 4: Generate lesson plan
    const promptInput = {
      trainingFocus: input.trainingFocus,
      clarifiedTopic: topicResolution.clarifiedTopic,
      seniorityLevel: input.seniorityLevel,
      learningScope: input.learningScope,
      duration: input.duration,
      legalContent: legalText || 'No specific legal content available for this topic.',
      companyContext: companyContext || 'No company-specific policies configured.',
      companyName
    };
    
    const { output } = await enhancedPrompt(promptInput);
    
    if (!output?.lessonPlan) {
      throw new Error('Failed to generate enhanced lesson plan content');
    }
    
    // Step 4.5: Enhance lesson plan with interactive quizzes
    const { enhancedPlan, quizModules } = await enhanceLessonPlanWithQuizzes(
      output.lessonPlan,
      references,
      input.companyId ? await getCompanyMetadata(input.companyId) : null,
      companyName
    );
    
    console.log(`📝 Generated ${quizModules.length} interactive quizzes for training modules`);
    
    // Step 5: Parse the enhanced plan
    const parsedPlan = input.planParser(enhancedPlan);
    
    // Step 6: Save enhanced onboarding track
    const trackId = await saveOnboardingTrack({
      trainingFocus: input.trainingFocus,
      clarifiedTopic: topicResolution.clarifiedTopic,
      duration: input.duration,
      seniorityLevel: input.seniorityLevel,
      learningScope: input.learningScope,
      companyId: input.companyId || 'default',
      createdBy: input.userId,
      plan: parsedPlan,
      status: 'draft',
      branding: {
        companyName
      }
    });
    
    console.log('✅ Enhanced lesson plan generated successfully');
    
    return {
      lessonPlan: enhancedPlan,
      trackId,
      parsedPlan,
      legalReferences: references,
      companyPolicies,
      clarifiedTopic: topicResolution.clarifiedTopic
    };
    
  } catch (error) {
    console.error('❌ Enhanced lesson plan generation failed:', error);
    throw error;
  }
});

/**
 * Gets unresolved topics for monitoring
 */
export function getUnresolvedTopics(): typeof UNRESOLVED_TOPICS {
  return [...UNRESOLVED_TOPICS];
}

/**
 * Clears unresolved topics log
 */
export function clearUnresolvedTopics(): void {
  UNRESOLVED_TOPICS.length = 0;
}

/**
 * Public interface function
 */
export async function generateTrackFromParams(params: EnhancedGenerateLessonPlanInput): Promise<EnhancedGenerateLessonPlanOutput> {
  return generateEnhancedLessonPlan(params);
}