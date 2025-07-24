import { z } from 'zod';

// Company metadata schema for companyMetadata collection
export const CompanyPoliciesSchema = z.object({
  leave: z.string(),
  probation: z.string(),
  termination: z.string(),
  training: z.string(),
  overtime: z.string(),
  conduct: z.string(),
});

export const CompanyMetadataEnhancedSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  contactEmail: z.string(),
  policies: CompanyPoliciesSchema,
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export type CompanyPolicies = z.infer<typeof CompanyPoliciesSchema>;
export type CompanyMetadataEnhanced = z.infer<typeof CompanyMetadataEnhancedSchema>;

// Mock storage for company metadata
let MOCK_COMPANY_METADATA_ENHANCED: CompanyMetadataEnhanced[] = [];

/**
 * Saves company metadata to Firebase
 */
export async function saveCompanyMetadata(
  data: Omit<CompanyMetadataEnhanced, 'createdAt' | 'lastUpdated'>
): Promise<void> {
  const now = new Date().toISOString();
  
  // Check if company already exists
  const existingIndex = MOCK_COMPANY_METADATA_ENHANCED.findIndex(
    c => c.companyId === data.companyId
  );
  
  const companyData: CompanyMetadataEnhanced = {
    ...data,
    createdAt: existingIndex >= 0 ? MOCK_COMPANY_METADATA_ENHANCED[existingIndex].createdAt : now,
    lastUpdated: now,
  };
  
  if (existingIndex >= 0) {
    MOCK_COMPANY_METADATA_ENHANCED[existingIndex] = companyData;
    console.log(`Updated company metadata for: ${data.companyName}`);
  } else {
    MOCK_COMPANY_METADATA_ENHANCED.push(companyData);
    console.log(`Created company metadata for: ${data.companyName}`);
  }
}

/**
 * Gets company metadata by ID
 */
export async function getCompanyMetadata(companyId: string): Promise<CompanyMetadataEnhanced | null> {
  const company = MOCK_COMPANY_METADATA_ENHANCED.find(c => c.companyId === companyId);
  return company || null;
}

/**
 * Gets all company metadata
 */
export async function getAllCompanyMetadata(): Promise<CompanyMetadataEnhanced[]> {
  return [...MOCK_COMPANY_METADATA_ENHANCED];
}

/**
 * Creates Desaria Group company metadata
 */
export async function createDesariaGroupMetadata(): Promise<void> {
  const desariaData: Omit<CompanyMetadataEnhanced, 'createdAt' | 'lastUpdated'> = {
    companyId: "desaria_group",
    companyName: "Desaria Group",
    contactEmail: "onboarding@witventure.com",
    policies: {
      leave: "14 days annual leave, no carry-forward",
      probation: "3 months with monthly review",
      termination: "1 month notice or salary in lieu",
      training: "Every new staff must attend 7-day induction",
      overtime: "Paid hourly, only after 48 hours/week",
      conduct: "Follow PDPA, zero tolerance for harassment"
    }
  };
  
  await saveCompanyMetadata(desariaData);
  console.log('✅ Desaria Group metadata created successfully');
}

/**
 * Contextualizes training content with company policies
 */
export async function contextualizeWithCompanyPolicy(
  companyId: string,
  trainingTopic: string,
  baseContent: string
): Promise<string> {
  const company = await getCompanyMetadata(companyId);
  if (!company) {
    return baseContent;
  }
  
  let contextualizedContent = baseContent;
  
  // Add company-specific policy context based on topic
  if (trainingTopic.toLowerCase().includes('leave')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.leave}`;
  }
  
  if (trainingTopic.toLowerCase().includes('probation')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.probation}`;
  }
  
  if (trainingTopic.toLowerCase().includes('termination')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.termination}`;
  }
  
  if (trainingTopic.toLowerCase().includes('training') || trainingTopic.toLowerCase().includes('induction')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.training}`;
  }
  
  if (trainingTopic.toLowerCase().includes('overtime')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.overtime}`;
  }
  
  if (trainingTopic.toLowerCase().includes('conduct') || trainingTopic.toLowerCase().includes('harassment')) {
    contextualizedContent += `\n\n**${company.companyName} Policy:** ${company.policies.conduct}`;
  }
  
  return contextualizedContent;
}