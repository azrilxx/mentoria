import { z } from 'zod';

// Legal document schema for legalLibrary collection
export const LegalDocumentSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  lawTitle: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().url(),
  fullText: z.string().max(50000),
  keywords: z.array(z.string()),
  relevanceTags: z.array(z.string()),
  onboardingRelevance: z.boolean().default(false),
  useInClarification: z.boolean().default(false),
  synonyms: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export type LegalDocument = z.infer<typeof LegalDocumentSchema>;

// Ingestion statistics schema
export const IngestionStatsSchema = z.object({
  lawsParsed: z.number(),
  docsUploaded: z.number(),
  lastUpdated: z.string(),
  sourcesProcessed: z.array(z.string()),
});

export type IngestionStats = z.infer<typeof IngestionStatsSchema>;

// HR-relevant trigger keywords
export const HR_ONBOARDING_TRIGGERS = [
  'strata', 'audit', 'gst', 'company registration', 'termination', 
  'contract', 'leave policy', 'employment', 'salary', 'benefits',
  'compliance', 'data protection', 'pdpa', 'workplace safety',
  'harassment', 'discrimination', 'grievance', 'disciplinary'
];

// Malaysian legal source configurations
export const LEGAL_SOURCES = [
  {
    name: 'Malaysian Bar Association',
    baseUrl: 'https://www.malaysianbar.org.my/',
    priority: 'medium',
    type: 'professional_body'
  },
  {
    name: 'Laws of Malaysia Portal',
    baseUrl: 'https://lom.agc.gov.my/',
    priority: 'high',
    type: 'official_government'
  },
  {
    name: 'Department of Town and Country Planning',
    baseUrl: 'https://www.jkp.gov.my/',
    priority: 'medium',
    type: 'government_department'
  },
  {
    name: 'Ministry of Housing and Local Government',
    baseUrl: 'https://www.kpkt.gov.my/',
    priority: 'medium',
    type: 'government_ministry'
  },
  {
    name: 'National Audit Department',
    baseUrl: 'https://www.audit.gov.my/',
    priority: 'medium',
    type: 'government_department'
  }
];

// Category mappings for Malaysian laws
export const LAW_CATEGORIES = {
  'strata': 'Strata Management',
  'property': 'Property Law',
  'employment': 'Employment Law',
  'company': 'Corporate Law',
  'data': 'Data Protection',
  'tax': 'Taxation',
  'audit': 'Audit and Compliance',
  'construction': 'Construction and Building',
  'environment': 'Environmental Law',
  'trade': 'Trade and Commerce'
};

import { 
  saveLegalDocumentToFirebase, 
  getAllLegalDocuments, 
  clearLegalLibraryFirebase,
  updateLegalLibraryBatch 
} from './firebase';

/**
 * Extracts keywords from legal content using basic NLP
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'by', 'from',
    'shall', 'may', 'must', 'any', 'all', 'such', 'this', 'that', 'these',
    'those', 'are', 'is', 'be', 'been', 'being', 'have', 'has', 'had'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, 20); // Limit to top 20 keywords
}

/**
 * Determines if content is relevant for HR onboarding
 */
export function isHRRelevant(content: string, title: string): boolean {
  const text = (content + ' ' + title).toLowerCase();
  return HR_ONBOARDING_TRIGGERS.some(trigger => 
    text.includes(trigger.toLowerCase())
  );
}

/**
 * Categorizes legal content based on title and content
 */
export function categorizeLegalContent(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();
  
  for (const [keyword, category] of Object.entries(LAW_CATEGORIES)) {
    if (text.includes(keyword)) {
      return category;
    }
  }
  
  return 'General Law';
}

/**
 * Generates synonyms for legal terms
 */
export function generateSynonyms(title: string): string[] {
  const synonymMap: Record<string, string[]> = {
    'strata': ['strata title', 'strata management', 'building management', 'jmb', 'mc'],
    'audit': ['auditing', 'financial audit', 'compliance audit', 'internal audit'],
    'company': ['corporation', 'business entity', 'corporate entity', 'enterprise'],
    'employment': ['employment act', 'labor law', 'worker rights', 'employee rights'],
    'data protection': ['pdpa', 'privacy law', 'data privacy', 'personal data'],
  };

  const titleLower = title.toLowerCase();
  const synonyms: string[] = [];

  for (const [key, values] of Object.entries(synonymMap)) {
    if (titleLower.includes(key)) {
      synonyms.push(...values);
    }
  }

  return [...new Set(synonyms)];
}

/**
 * Saves a legal document to Firebase
 */
export async function saveLegalDocument(doc: Omit<LegalDocument, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
  return await saveLegalDocumentToFirebase(doc);
}

/**
 * Updates ingestion statistics
 */
export async function updateIngestionStats(stats: IngestionStats): Promise<void> {
  console.log('Updating ingestion statistics:', stats);
  // In a real implementation, this would update Firestore document at status/legalIngestStats
}

/**
 * Gets all documents from the legal library
 */
export async function getLegalLibrary(): Promise<LegalDocument[]> {
  return await getAllLegalDocuments();
}

/**
 * Clears the legal library (for testing purposes)
 */
export async function clearLegalLibrary(): Promise<void> {
  await clearLegalLibraryFirebase();
}