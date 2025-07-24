// IMPORTANT: This file is a placeholder for the Firebase Admin SDK setup.
// In a real Firebase project, you would initialize the admin app here.
// For Firebase Studio, we will simulate the database interactions.
// DO NOT MODIFY THIS FILE to add Admin SDK initialization.

import {z} from 'zod';
import { DailyPlanSchema } from '@/lib/schemas';
import { LegalDocument, LegalDocumentSchema } from './legal-ingestion';
import { CompanyMetadataEnhanced } from './company-metadata';

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

// `sops` collection / `company_sops`
export const SopSchema = z.object({
    id: z.string().optional(),
    companyId: z.string(),
    uploadedBy: z.string(),
    department: z.string(),
    tags: z.array(z.string()),
    fileUrl: z.string(),
    fileName: z.string(),
    createdAt: z.string(),
    linkedLaws: z.array(z.string()).optional(), // Matched law IDs
});
export type Sop = z.infer<typeof SopSchema>;

// `company_metadata` collection
export const CompanyMetadataSchema = z.object({
  companyId: z.string(),
  industry: z.string(),
  size: z.enum(['<50', '50–100', '100–500', '500+']),
  regulatoryBodies: z.array(z.string()),
  location: z.string(),
  focusAreas: z.array(z.string()),
});
export type CompanyMetadata = z.infer<typeof CompanyMetadataSchema>;

// Enhanced `onboardingTracks` collection with legal and company references
export const LegalReferenceSchema = z.object({
  lawTitle: z.string(),
  sourceUrl: z.string(),
  relevanceScore: z.number(),
});

export const CompanyPolicyReferenceSchema = z.object({
  policyType: z.string(),
  policyText: z.string(),
});

export const OnboardingTrackSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  createdBy: z.string(),
  trainingFocus: z.string(),
  clarifiedTopic: z.string(),
  seniorityLevel: z.string(),
  learningScope: z.string(),
  duration: z.number(),
  plan: z.array(DailyPlanSchema),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional(),
  createdAt: z.string().optional(),
  branding: z.object({
      companyName: z.string(),
      logoUrl: z.string().optional(),
      colorScheme: z.object({
          primary: z.string(),
          accent: z.string(),
      }).optional(),
  }),
  // Enhanced fields for legal and company integration
  legalReferences: z.array(LegalReferenceSchema).optional(),
  companyPolicies: z.array(CompanyPolicyReferenceSchema).optional(),
  sourceMetadata: z.object({
    lawRefs: z.array(z.string()).optional(),
    companyRefs: z.array(z.string()).optional(),
    unresolvedTopics: z.array(z.string()).optional(),
  }).optional(),
});

export type OnboardingTrack = z.infer<typeof OnboardingTrackSchema>;
export type LegalReference = z.infer<typeof LegalReferenceSchema>;
export type CompanyPolicyReference = z.infer<typeof CompanyPolicyReferenceSchema>;

// User Progress Tracking Schema
export const UserProgressSchema = z.object({
  id: z.string().optional(),
  trackId: z.string(),
  status: z.enum(["draft", "confirmed", "archived"]),
  generatedAt: z.string(),
  lastViewed: z.string(),
  confirmedAt: z.string().optional(),
  duration: z.number(),
  topic: z.string(),
  scope: z.string(),
  seniority: z.string(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;


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
        tags: ['audit', 'compliance', 'pdpa'],
        fileUrl: '/sops/desaria-group-123/Internal_Audit_Checklist.pdf',
        fileName: 'Internal_Audit_Checklist.pdf',
        createdAt: new Date().toISOString(),
        linkedLaws: ['law_pdpa2010'],
    }
];

const MOCK_COMPANY_METADATA: CompanyMetadata[] = [
    {
        companyId: 'desaria-group-123',
        industry: 'Real Estate & Construction',
        size: '500+',
        regulatoryBodies: ['CIDB', 'BEM'],
        location: 'Kuala Lumpur',
        focusAreas: ['compliance', 'governance', 'customer service'],
    }
];


let MOCK_ONBOARDING_TRACKS: OnboardingTrack[] = [];

// `legalLibrary` collection (from legal ingestion engine)
let MOCK_LEGAL_LIBRARY: LegalDocument[] = [];

// User Progress Tracking Mock Storage
let MOCK_USER_PROGRESS: { [uid: string]: UserProgress[] } = {};


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

export async function getLawsByIds(ids: string[]): Promise<Law[]> {
    console.log(`Fetching laws with IDs: ${ids.join(', ')}`);
    if (ids.length === 0) return [];
    return MOCK_LAWS.filter(law => ids.includes(law.id));
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

/**
 * Simulates saving an SOP and then "analyzing" it to link to relevant laws.
 */
export async function saveSop(sopData: Omit<Sop, 'id' | 'createdAt'>): Promise<string> {
    console.log(`Saving new SOP: ${sopData.fileName}`);
    
    // Simulate NLP/keyword matching to link laws
    const linkedLaws: string[] = [];
    for (const law of MOCK_LAWS) {
        // If any of the SOP's tags are present in the law's domainTags, link them.
        if (sopData.tags.some(tag => law.domainTags.includes(tag))) {
            if (!linkedLaws.includes(law.id)) {
                linkedLaws.push(law.id);
            }
        }
    }
    console.log(`Automatically linked SOP to ${linkedLaws.length} laws.`);

    const newSop: Sop = {
        ...sopData,
        id: `sop_${Date.now()}`,
        createdAt: new Date().toISOString(),
        linkedLaws: linkedLaws,
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
    console.log(`Saved track with ID: ${newTrack.id}, Current Tracks:`, MOCK_ONBOARDING_TRACKS);
    return newTrack.id!;
}

export async function getOnboardingTrackById(trackId: string): Promise<OnboardingTrack | null> {
    console.log(`Fetching onboarding track with ID: ${trackId}`);
    const track = MOCK_ONBOARDING_TRACKS.find(track => track.id === trackId);
    return track || null;
}

// LEGAL LIBRARY FUNCTIONS

export async function searchLegalLibrary(query: string): Promise<LegalDocument[]> {
    console.log(`Searching legal library for: ${query}`);
    const searchTerms = query.toLowerCase().split(' ');
    
    return MOCK_LEGAL_LIBRARY.filter(doc => {
        const searchableText = (
            doc.lawTitle + ' ' + 
            doc.category + ' ' + 
            doc.keywords.join(' ') + ' ' +
            doc.synonyms.join(' ')
        ).toLowerCase();
        
        return searchTerms.some(term => searchableText.includes(term));
    });
}

export async function getLegalDocumentsByCategory(category: string): Promise<LegalDocument[]> {
    console.log(`Fetching legal documents for category: ${category}`);
    return MOCK_LEGAL_LIBRARY.filter(doc => 
        doc.category.toLowerCase() === category.toLowerCase()
    );
}

export async function getHRRelevantLegalDocs(): Promise<LegalDocument[]> {
    console.log('Fetching HR-relevant legal documents');
    return MOCK_LEGAL_LIBRARY.filter(doc => doc.onboardingRelevance);
}

export async function saveLegalDocumentToFirebase(docData: Omit<LegalDocument, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    console.log(`Saving legal document: ${docData.lawTitle}`);
    const newDoc: LegalDocument = {
        ...docData,
        id: `legal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    };
    MOCK_LEGAL_LIBRARY.push(newDoc);
    console.log(`Saved legal document with ID: ${newDoc.id}`);
    return newDoc.id!;
}

export async function getAllLegalDocuments(): Promise<LegalDocument[]> {
    return [...MOCK_LEGAL_LIBRARY];
}

export async function clearLegalLibraryFirebase(): Promise<void> {
    MOCK_LEGAL_LIBRARY = [];
    console.log('Legal library cleared in Firebase');
}

export async function updateLegalLibraryBatch(documents: LegalDocument[]): Promise<void> {
    MOCK_LEGAL_LIBRARY = [...documents];
    console.log(`Updated legal library with ${documents.length} documents`);
}

// USER PROGRESS TRACKING FUNCTIONS

export async function saveUserProgress(uid: string, progressData: Omit<UserProgress, 'id'>): Promise<string> {
    console.log(`Saving progress for user ${uid}, trackId: ${progressData.trackId}`);
    
    if (!MOCK_USER_PROGRESS[uid]) {
        MOCK_USER_PROGRESS[uid] = [];
    }
    
    const newProgress: UserProgress = {
        ...progressData,
        id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    MOCK_USER_PROGRESS[uid].push(newProgress);
    console.log(`Saved progress with ID: ${newProgress.id}`);
    return newProgress.id!;
}

export async function getUserProgress(uid: string): Promise<UserProgress[]> {
    console.log(`Fetching progress for user ${uid}`);
    if (!MOCK_USER_PROGRESS[uid]) {
        MOCK_USER_PROGRESS[uid] = [];
    }
    return [...MOCK_USER_PROGRESS[uid]].sort((a, b) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
}

export async function updateUserProgress(uid: string, progressId: string, updates: Partial<UserProgress>): Promise<void> {
    console.log(`Updating progress ${progressId} for user ${uid}`);
    
    if (!MOCK_USER_PROGRESS[uid]) {
        console.warn(`No progress found for user ${uid}`);
        return;
    }
    
    const progressIndex = MOCK_USER_PROGRESS[uid].findIndex(p => p.id === progressId);
    if (progressIndex === -1) {
        console.warn(`Progress ${progressId} not found for user ${uid}`);
        return;
    }
    
    MOCK_USER_PROGRESS[uid][progressIndex] = {
        ...MOCK_USER_PROGRESS[uid][progressIndex],
        ...updates,
    };
    
    console.log(`Updated progress ${progressId}`);
}

export async function getUserProgressByTrackId(uid: string, trackId: string): Promise<UserProgress | null> {
    console.log(`Fetching progress for user ${uid} and track ${trackId}`);
    
    if (!MOCK_USER_PROGRESS[uid]) {
        return null;
    }
    
    return MOCK_USER_PROGRESS[uid].find(p => p.trackId === trackId) || null;
}
