import { QuizModule, TrainingModule } from '@/lib/schemas';
import { LegalDocument } from './legal-ingestion';
import { CompanyMetadataEnhanced } from './company-metadata';

/**
 * Quiz Generation Service for Interactive Training Modules
 * 
 * Generates MCQs based on legal content and company policies with:
 * - 1 correct answer and 3 plausible distractors
 * - Explanations linked to source material
 * - Variety in question structure
 * - Safety checks for content validity
 */

// Question templates for variety
const QUESTION_TEMPLATES = [
  {
    type: 'definition',
    pattern: 'What is {concept} according to {source}?',
    formats: [
      'According to {source}, what is {concept}?',
      'How is {concept} defined in {source}?',
      'What does {source} define as {concept}?'
    ]
  },
  {
    type: 'requirement',
    pattern: 'What is required for {action} under {source}?',
    formats: [
      'Under {source}, what is required for {action}?',
      '{source} requires what for {action}?',
      'What must be done for {action} according to {source}?'
    ]
  },
  {
    type: 'timeframe',
    pattern: 'What is the {timeframe} specified in {source}?',
    formats: [
      'According to {source}, what is the {timeframe}?',
      'What {timeframe} does {source} specify?',
      'How long is the {timeframe} under {source}?'
    ]
  },
  {
    type: 'compliance',
    pattern: 'What must {entity} do to comply with {source}?',
    formats: [
      'To comply with {source}, {entity} must:',
      'Under {source}, {entity} is required to:',
      'What compliance requirement does {source} impose on {entity}?'
    ]
  }
];

/**
 * Extracts key concepts from training module content
 */
function extractKeyConcepts(moduleTitle: string, moduleSummary: string): {
  concepts: string[];
  actions: string[];
  timeframes: string[];
  entities: string[];
} {
  const content = (moduleTitle + ' ' + moduleSummary).toLowerCase();
  
  // Extract concepts (nouns that might be important)
  const concepts = [];
  if (content.includes('termination')) concepts.push('termination');
  if (content.includes('notice')) concepts.push('notice period');
  if (content.includes('strata')) concepts.push('strata management');
  if (content.includes('data protection')) concepts.push('personal data protection');
  if (content.includes('harassment')) concepts.push('sexual harassment');
  if (content.includes('probation')) concepts.push('probationary period');
  if (content.includes('leave')) concepts.push('annual leave');
  if (content.includes('overtime')) concepts.push('overtime work');
  
  // Extract actions (verbs/processes)
  const actions = [];
  if (content.includes('dismiss') || content.includes('terminate')) actions.push('dismissing an employee');
  if (content.includes('hire') || content.includes('employ')) actions.push('hiring an employee');
  if (content.includes('process') || content.includes('collect')) actions.push('processing personal data');
  if (content.includes('maintain')) actions.push('maintaining common property');
  if (content.includes('report')) actions.push('reporting incidents');
  
  // Extract timeframes
  const timeframes = [];
  if (content.includes('month')) timeframes.push('notice period');
  if (content.includes('day')) timeframes.push('response time');
  if (content.includes('year')) timeframes.push('review period');
  if (content.includes('week')) timeframes.push('processing time');
  
  // Extract entities
  const entities = [];
  if (content.includes('employee')) entities.push('employees');
  if (content.includes('employer')) entities.push('employers');
  if (content.includes('company')) entities.push('companies');
  if (content.includes('management')) entities.push('management corporations');
  if (content.includes('data user')) entities.push('data users');
  
  return { concepts, actions, timeframes, entities };
}

/**
 * Generates plausible distractors based on the correct answer
 */
function generateDistractors(correctAnswer: string, context: string): string[] {
  const distractors: string[] = [];
  const answerLower = correctAnswer.toLowerCase();
  
  // Time-based distractors
  if (answerLower.includes('month')) {
    distractors.push('2 weeks', '3 months', '6 months');
  } else if (answerLower.includes('week')) {
    distractors.push('3 days', '1 month', '2 weeks');
  } else if (answerLower.includes('day')) {
    distractors.push('1 week', '2 weeks', '1 month');
  }
  
  // Yes/No distractors
  else if (answerLower === 'yes' || answerLower === 'true') {
    distractors.push('No', 'Only in certain cases', 'Depends on circumstances');
  } else if (answerLower === 'no' || answerLower === 'false') {
    distractors.push('Yes', 'Only with approval', 'Under specific conditions');
  }
  
  // Numerical distractors
  else if (answerLower.includes('8 hours')) {
    distractors.push('6 hours', '10 hours', '12 hours');
  } else if (answerLower.includes('48 hours')) {
    distractors.push('40 hours', '44 hours', '50 hours');
  }
  
  // Legal entity distractors
  else if (answerLower.includes('management corporation')) {
    distractors.push('Joint Management Body', 'Strata Committee', 'Building Manager');
  } else if (answerLower.includes('joint management body')) {
    distractors.push('Management Corporation', 'Residents Committee', 'Property Manager');
  }
  
  // Compliance distractors
  else if (answerLower.includes('consent')) {
    distractors.push('Authorization', 'Permission', 'Approval');
  } else if (answerLower.includes('written notice')) {
    distractors.push('Verbal notification', 'Email notice', 'SMS notification');
  }
  
  // Fallback generic distractors
  if (distractors.length < 3) {
    const genericOptions = [
      'Not specified',
      'At management discretion',
      'As per company policy',
      'Subject to approval',
      'Depends on circumstances',
      'Not applicable',
      'Under review'
    ];
    
    while (distractors.length < 3) {
      const option = genericOptions[Math.floor(Math.random() * genericOptions.length)];
      if (!distractors.includes(option) && option !== correctAnswer) {
        distractors.push(option);
      }
    }
  }
  
  return distractors.slice(0, 3);
}

/**
 * Generates a quiz for employment-related content
 */
function generateEmploymentQuiz(module: { title: string; summary: string; reference?: string }): QuizModule | null {
  const { title, summary, reference } = module;
  const content = title + ' ' + summary;
  
  // Termination-related questions
  if (content.toLowerCase().includes('termination')) {
    if (content.includes('1 month') || content.includes('1-month')) {
      return {
        question: "What is the standard notice period for employment termination?",
        options: ["2 weeks", "1 month", "3 months", "Immediate"],
        correctAnswer: "1 month",
        explanation: "Most employment terminations require 1 month notice or payment in lieu, as specified in the Employment Act and company policies.",
        sourceRef: reference
      };
    }
  }
  
  // Working hours questions
  if (content.toLowerCase().includes('hours') || content.toLowerCase().includes('overtime')) {
    return {
      question: "What is the maximum normal working hours per day under Malaysian law?",
      options: ["6 hours", "8 hours", "10 hours", "12 hours"],
      correctAnswer: "8 hours",
      explanation: "The Employment Act 1955 specifies that normal working hours shall not exceed 8 hours per day or 48 hours per week.",
      sourceRef: reference
    };
  }
  
  // Leave-related questions
  if (content.toLowerCase().includes('leave')) {
    return {
      question: "What is the minimum annual leave entitlement for employees with less than 2 years service?",
      options: ["6 days", "8 days", "12 days", "14 days"],
      correctAnswer: "8 days",
      explanation: "Under the Employment Act 1955, employees with less than 2 years of service are entitled to a minimum of 8 days annual leave.",
      sourceRef: reference
    };
  }
  
  return null;
}

/**
 * Generates a quiz for strata management content
 */
function generateStrataQuiz(module: { title: string; summary: string; reference?: string }): QuizModule | null {
  const { title, summary, reference } = module;
  const content = title + ' ' + summary;
  
  if (content.toLowerCase().includes('strata') || content.toLowerCase().includes('management')) {
    if (content.toLowerCase().includes('maintenance')) {
      return {
        question: "Who is responsible for maintaining common property in a strata development?",
        options: ["Individual owners", "Management Corporation", "Developer", "Local council"],
        correctAnswer: "Management Corporation",
        explanation: "The Strata Management Act 2013 assigns responsibility for maintaining common property to the Management Corporation (MC) or Joint Management Body (JMB).",
        sourceRef: reference
      };
    }
    
    if (content.toLowerCase().includes('charges') || content.toLowerCase().includes('fees')) {
      return {
        question: "How are strata management charges typically apportioned?",
        options: ["Equally among all units", "Based on share units", "By unit size only", "At flat rate"],
        correctAnswer: "Based on share units",
        explanation: "Strata management charges are apportioned based on the share units allocated to each parcel as specified in the strata title.",
        sourceRef: reference
      };
    }
  }
  
  return null;
}

/**
 * Generates a quiz for data protection content
 */
function generateDataProtectionQuiz(module: { title: string; summary: string; reference?: string }): QuizModule | null {
  const { title, summary, reference } = module;
  const content = title + ' ' + summary;
  
  if (content.toLowerCase().includes('data') || content.toLowerCase().includes('pdpa')) {
    if (content.toLowerCase().includes('consent')) {
      return {
        question: "Under the PDPA 2010, when can personal data be processed without consent?",
        options: ["Never", "For legal compliance", "With supervisor approval", "During business hours"],
        correctAnswer: "For legal compliance",
        explanation: "The PDPA allows processing without consent when necessary for compliance with legal obligations or for other specified lawful purposes.",
        sourceRef: reference
      };
    }
    
    if (content.toLowerCase().includes('notice')) {
      return {
        question: "What must data users inform data subjects about when collecting personal data?",
        options: ["Only the collection purpose", "Purpose and potential disclosures", "Just storage duration", "Only contact details"],
        correctAnswer: "Purpose and potential disclosures",
        explanation: "The PDPA requires data users to inform data subjects about the purpose of collection, potential disclosures, and their rights regarding the data.",
        sourceRef: reference
      };
    }
  }
  
  return null;
}

/**
 * Generates a quiz for company policy content
 */
function generateCompanyPolicyQuiz(module: { title: string; summary: string; reference?: string }, companyName: string = 'the company'): QuizModule | null {
  const { title, summary, reference } = module;
  const content = title + ' ' + summary;
  
  if (content.toLowerCase().includes('desaria') || content.toLowerCase().includes('company policy')) {
    if (content.includes('1 month notice')) {
      return {
        question: `What is ${companyName}'s termination notice requirement?`,
        options: ["2 weeks notice", "1 month notice or salary in lieu", "3 months notice", "Immediate termination"],
        correctAnswer: "1 month notice or salary in lieu",
        explanation: `${companyName} requires 1 month notice or payment of salary in lieu for employment termination, as per their HR policy.`,
        sourceRef: reference
      };
    }
    
    if (content.toLowerCase().includes('harassment')) {
      return {
        question: `What is ${companyName}'s policy on workplace harassment?`,
        options: ["Case-by-case basis", "Zero tolerance", "Warning system", "Mediation first"],
        correctAnswer: "Zero tolerance",
        explanation: `${companyName} maintains a zero tolerance policy for harassment and ensures compliance with PDPA and professional conduct standards.`,
        sourceRef: reference
      };
    }
    
    if (content.toLowerCase().includes('7-day induction')) {
      return {
        question: `What is the duration of ${companyName}'s mandatory induction program?`,
        options: ["3 days", "5 days", "7 days", "2 weeks"],
        correctAnswer: "7 days",
        explanation: `${companyName} requires every new staff member to attend a comprehensive 7-day induction program.`,
        sourceRef: reference
      };
    }
  }
  
  return null;
}

/**
 * Main quiz generation function
 */
export function generateQuizForModule(
  module: { title: string; summary: string; reference?: string },
  legalContext?: LegalDocument[],
  companyContext?: CompanyMetadataEnhanced
): QuizModule | null {
  
  // Safety check: Skip if content is too vague
  if (module.summary.length < 20 || !module.title) {
    console.log(`⚠️ Skipping quiz generation for vague module: ${module.title}`);
    return null;
  }
  
  // Try employment-related quiz first
  let quiz = generateEmploymentQuiz(module);
  if (quiz) return quiz;
  
  // Try strata management quiz
  quiz = generateStrataQuiz(module);
  if (quiz) return quiz;
  
  // Try data protection quiz
  quiz = generateDataProtectionQuiz(module);
  if (quiz) return quiz;
  
  // Try company policy quiz
  if (companyContext) {
    quiz = generateCompanyPolicyQuiz(module, companyContext.companyName);
    if (quiz) return quiz;
  }
  
  // Fallback: Generate generic comprehension quiz
  return generateGenericQuiz(module);
}

/**
 * Generates a generic comprehension quiz when specific patterns don't match
 */
function generateGenericQuiz(module: { title: string; summary: string; reference?: string }): QuizModule | null {
  const { title, summary, reference } = module;
  
  // Extract key terms from the module
  const words = summary.split(' ').filter(word => word.length > 4);
  if (words.length < 3) return null;
  
  const keyTerm = words.find(word => 
    word.toLowerCase().includes('requir') ||
    word.toLowerCase().includes('must') ||
    word.toLowerCase().includes('shall') ||
    word.toLowerCase().includes('need')
  ) || words[0];
  
  return {
    question: `What is the main focus of "${title}"?`,
    options: [
      summary.substring(0, 50) + '...',
      'General compliance requirements',
      'Administrative procedures',
      'Training documentation'
    ],
    correctAnswer: summary.substring(0, 50) + '...',
    explanation: `This module focuses on ${title.toLowerCase()}, covering the key aspects described in the training content.`,
    sourceRef: reference
  };
}

/**
 * Validates quiz quality and safety
 */
export function validateQuiz(quiz: QuizModule): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check question quality
  if (quiz.question.length < 10) {
    issues.push('Question too short');
  }
  
  if (!quiz.question.includes('?')) {
    issues.push('Question missing question mark');
  }
  
  // Check options
  if (quiz.options.length < 3 || quiz.options.length > 4) {
    issues.push('Invalid number of options (must be 3-4)');
  }
  
  if (!quiz.options.includes(quiz.correctAnswer)) {
    issues.push('Correct answer not found in options');
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(quiz.options);
  if (uniqueOptions.size !== quiz.options.length) {
    issues.push('Duplicate options found');
  }
  
  // Check explanation
  if (quiz.explanation.length < 20) {
    issues.push('Explanation too short');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Enhances a training module with a quiz
 */
export function enhanceModuleWithQuiz(
  moduleTitle: string,
  moduleSummary: string,
  moduleReference?: string,
  legalContext?: LegalDocument[],
  companyContext?: CompanyMetadataEnhanced
): TrainingModule {
  
  const quiz = generateQuizForModule(
    { title: moduleTitle, summary: moduleSummary, reference: moduleReference },
    legalContext,
    companyContext
  );
  
  return {
    title: moduleTitle,
    summary: moduleSummary,
    reference: moduleReference,
    quiz: quiz || undefined,
    completed: false
  };
}