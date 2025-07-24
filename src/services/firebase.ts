// IMPORTANT: This file is a placeholder for the Firebase Admin SDK setup.
// In a real Firebase project, you would initialize the admin app here.
// For Firebase Studio, we will simulate the database interactions.
// DO NOT MODIFY THIS FILE to add Admin SDK initialization.

import {z} from 'zod';

// MOCK DATA and SCHEMAS

// `laws` collection
const LawSectionSchema = z.object({
  section: z.string(),
  title: z.string(),
  summary: z.string(),
  reference: z.string().url().optional(),
});
export const LawSchema = z.object({
  id: z.string(),
  title: z.string(),
  shortCode: z.string(),
  description: z.string(),
  domainTags: z.array(z.string()),
  sections: z.array(LawSectionSchema),
  lastReviewed: z.string(), // Using string for mock simplicity
});
export type Law = z.infer<typeof LawSchema>;

// `legalTrainingMappings` collection
export const LegalTrainingMappingSchema = z.object({
  id: z.string(),
  userInput: z.string(),
  resolvedLawIds: z.array(z.string()),
  recommendedModules: z.array(z.string()),
  fallbackSummary: z.string(),
  priority: z.number(),
  lastUpdated: z.string(),
});
export type LegalTrainingMapping = z.infer<typeof LegalTrainingMappingSchema>;

// `companies/{companyId}/customModules` collection
export const CustomModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  domainTags: z.array(z.string()),
  content: z.string(),
  createdBy: z.string(),
  visibility: z.enum(['private', 'team', 'global']),
  approved: z.boolean(),
  lastModified: z.string(),
});
export type CustomModule = z.infer<typeof CustomModuleSchema>;

// `sops` collection
export const SopSchema = z.object({
    id: z.string().optional(),
    companyId: z.string(),
    uploadedBy: z.string(),
    department: z.string(),
    tags: z.array(z.string()),
    fileUrl: z.string(),
    fileName: z.string(),
    createdAt: z.string(),
});
export type Sop = z.infer<typeof SopSchema>;


// `onboardingTracks` collection
export const OnboardingTrackSchema = z.object({
  id: z.string().optional(),
  trainingFocus: z.string(),
  duration: z.number(),
  seniorityLevel: z.string(),
  learningScope: z.string(),
  companyId: z.string(),
  resolvedLaws: z.array(z.string()),
  includedCustomModules: z.array(z.string()),
  includedSops: z.array(z.string()).optional(),
  generatedModules: z.array(z.any()), // Can be more specific later
  generatedPlanText: z.string(),
  createdAt: z.string(),
});
export type OnboardingTrack = z.infer<typeof OnboardingTrackSchema>;


// MOCK DATABASE
const MOCK_LAWS: Law[] = [
  {
    id: 'law_sma2013',
    title: 'Strata Management Act 2013',
    shortCode: 'SMA2013',
    description: 'An Act to provide for the proper maintenance and management of buildings and common property, and for related matters.',
    domainTags: ['property', 'strata', 'stratamanagementact2013'],
    sections: [
      { section: 'Section 21', title: 'Duties and powers of management corporation', summary: 'Outlines the main responsibilities of the JMB/MC, including maintenance of common property, determining and imposing charges, and insuring the building.' },
      { section: 'Section 59', title: 'Strata Management Tribunal', summary: 'Establishes the tribunal for hearing and determining disputes related to strata management.' },
      { section: 'Section 17A', title: 'Issuance of Strata Titles', summary: 'Specifies the duties of the developer to apply for strata titles for a subdivided building or land.'}
    ],
    lastReviewed: new Date().toISOString(),
  },
  {
    id: 'law_pdpa2010',
    title: 'Personal Data Protection Act 2010',
    shortCode: 'PDPA2010',
    description: 'An Act to regulate the processing of personal data in commercial transactions and to provide for matters connected therewith and incidental thereto.',
    domainTags: ['data privacy', 'pdpa', 'personaldataprotectionact2010', 'compliance'],
    sections: [
        { section: 'Section 5', title: 'General Principle', summary: 'Personal data shall not be processed unless the data user has obtained the consent of the data subject.' },
        { section: 'Section 6', title: 'Notice and Choice Principle', summary: 'Data users must inform data subjects of the purpose for which their data is being collected and to whom it may be disclosed.' }
    ],
    lastReviewed: new Date().toISOString(),
  }
];

const MOCK_MAPPINGS: LegalTrainingMapping[] = [
    {
        id: 'map_strata',
        userInput: 'strata',
        resolvedLawIds: ['law_sma2013'],
        recommendedModules: ["Strata Management Act (SMA 2013)", "Strata Title Issuance", "Strata JMB Governance"],
        fallbackSummary: 'General training on the management and maintenance of strata properties.',
        priority: 1,
        lastUpdated: new Date().toISOString(),
    }
];

const MOCK_CUSTOM_MODULES: (CustomModule & { companyId: string })[] = [
    {
        id: 'custom_complaint_sop',
        companyId: 'desaria-group-123',
        title: 'Complaint Handling SOP',
        domainTags: ['strata', 'customer service'],
        content: 'All resident complaints must be logged in the system within 2 hours. Acknowledge receipt to the resident via email immediately. Resolve within 3 working days.',
        createdBy: 'hr_admin_user',
        visibility: 'team',
        approved: true,
        lastModified: new Date().toISOString(),
    }
];

let MOCK_SOPS: Sop[] = [
    {
        id: 'sop_audit_1',
        companyId: 'desaria-group-123',
        uploadedBy: 'hr_admin_user',
        department: 'Finance',
        tags: ['audit', 'compliance'],
        fileUrl: '/sops/desaria-group-123/Internal_Audit_Checklist.pdf',
        fileName: 'Internal_Audit_Checklist.pdf',
        createdAt: new Date().toISOString(),
    }
];


const MOCK_ONBOARDING_TRACKS: OnboardingTrack[] = [];


// SIMULATED FIRESTORE FUNCTIONS

export async function getLegalTrainingMapping(userInput: string): Promise<LegalTrainingMapping | null> {
    console.log(`Searching for mapping with input: ${userInput}`);
    const mapping = MOCK_MAPPINGS.find(m => m.userInput.toLowerCase() === userInput.toLowerCase());
    return mapping || null;
}

export async function getLawsByTags(tags: string[]): Promise<Law[]> {
    console.log(`Fetching laws with tags: ${tags.join(', ')}`);
    if (tags.length === 0) return MOCK_LAWS; // Return all if no tags
    return MOCK_LAWS.filter(law => 
        tags.some(tag => law.domainTags.includes(tag.toLowerCase()))
    );
}

export async function getCustomModulesByTags(companyId: string, tags: string[]): Promise<CustomModule[]> {
     console.log(`Fetching custom modules for company ${companyId} with tags: ${tags.join(', ')}`);
    return MOCK_CUSTOM_MODULES.filter(module => 
        module.companyId === companyId && 
        (tags.length === 0 || tags.some(tag => module.domainTags.includes(tag.toLowerCase())))
    );
}

export async function getSopsByTags(companyId: string, tags: string[]): Promise<Sop[]> {
    console.log(`Fetching SOPs for company ${companyId} with tags: ${tags.join(', ')}`);
    return MOCK_SOPS.filter(sop =>
        sop.companyId === companyId &&
        (tags.length === 0 || tags.some(tag => sop.tags.includes(tag.toLowerCase())))
    );
}

export async function getSopsByCompany(companyId: string): Promise<Sop[]> {
    console.log(`Fetching all SOPs for company ${companyId}`);
    return MOCK_SOPS.filter(sop => sop.companyId === companyId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSop(sopData: Omit<Sop, 'id' | 'createdAt'>): Promise<string> {
    console.log(`Saving new SOP: ${sopData.fileName}`);
    const newSop: Sop = {
        ...sopData,
        id: `sop_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    MOCK_SOPS.push(newSop);
    console.log(`Saved SOP with ID: ${newSop.id}`);
    return newSop.id!;
}

export async function deleteSop(sopId: string): Promise<void> {
    console.log(`Deleting SOP with ID: ${sopId}`);
    const index = MOCK_SOPS.findIndex(s => s.id === sopId);
    if (index > -1) {
        MOCK_SOPS.splice(index, 1);
        console.log(`SOP deleted.`);
    } else {
        console.warn(`SOP with ID ${sopId} not found.`);
        throw new Error("SOP not found");
    }
}


export async function saveOnboardingTrack(trackData: Omit<OnboardingTrack, 'id' | 'createdAt'>): Promise<string> {
    console.log(`Saving new onboarding track for focus: ${trackData.trainingFocus}`);
    const newTrack: OnboardingTrack = {
        ...trackData,
        id: `track_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    MOCK_ONBOARDING_TRACKS.push(newTrack);
    console.log(`Saved track with ID: ${newTrack.id}`);
    return newTrack.id!;
}
