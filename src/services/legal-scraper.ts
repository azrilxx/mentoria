import { 
  LegalDocument, 
  saveLegalDocument, 
  extractKeywords, 
  isHRRelevant, 
  categorizeLegalContent, 
  generateSynonyms,
  LEGAL_SOURCES,
  HR_ONBOARDING_TRIGGERS 
} from './legal-ingestion';

/**
 * Processes and structures legal content from web sources
 */
export class LegalContentProcessor {
  private processedCount = 0;
  private sourcesProcessed: string[] = [];

  /**
   * Processes raw legal content and creates structured legal documents
   */
  async processLegalContent(
    rawContent: string,
    sourceUrl: string,
    sourceType: string = 'government'
  ): Promise<LegalDocument[]> {
    const documents: LegalDocument[] = [];
    
    // Split content into potential law sections or acts
    const sections = this.extractLegalSections(rawContent);
    
    for (const section of sections) {
      if (this.isValidLegalContent(section)) {
        const doc = await this.createLegalDocument(section, sourceUrl, sourceType);
        if (doc) {
          documents.push(doc);
          await saveLegalDocument(doc);
          this.processedCount++;
        }
      }
    }

    this.sourcesProcessed.push(sourceUrl);
    return documents;
  }

  /**
   * Extracts potential legal sections from raw content
   */
  private extractLegalSections(content: string): string[] {
    // Look for common Malaysian legal document patterns
    const sectionPatterns = [
      /(?:Act|Akta)\s+\d+(?:\s+of\s+\d{4})?[\s\S]*?(?=(?:Act|Akta)\s+\d+|$)/gi,
      /(?:Section|Seksyen)\s+\d+[\s\S]*?(?=(?:Section|Seksyen)\s+\d+|$)/gi,
      /(?:Part|Bahagian)\s+[IVX]+[\s\S]*?(?=(?:Part|Bahagian)\s+[IVX]+|$)/gi,
    ];

    const sections: string[] = [];
    
    for (const pattern of sectionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        sections.push(...matches);
      }
    }

    // If no structured sections found, split by headings or paragraphs
    if (sections.length === 0) {
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
      sections.push(...paragraphs.slice(0, 10)); // Limit to first 10 paragraphs
    }

    return sections;
  }

  /**
   * Validates if content appears to be legal/regulatory material
   */
  private isValidLegalContent(content: string): boolean {
    const legalIndicators = [
      'act', 'law', 'regulation', 'section', 'subsection', 'provision',
      'shall', 'may', 'must', 'pursuant', 'accordance', 'compliance',
      'akta', 'undang-undang', 'peraturan', 'seksyen', 'pematuhan'
    ];

    const words = content.toLowerCase().split(/\s+/);
    const legalWordCount = words.filter(word => 
      legalIndicators.some(indicator => word.includes(indicator))
    ).length;

    return legalWordCount >= 3 && content.length > 200;
  }

  /**
   * Creates a structured legal document from content
   */
  private async createLegalDocument(
    content: string,
    sourceUrl: string,
    sourceType: string
  ): Promise<Omit<LegalDocument, 'id' | 'createdAt' | 'lastUpdated'> | null> {
    try {
      // Extract title from content
      const title = this.extractTitle(content);
      if (!title) return null;

      // Generate excerpt (first 200 characters)
      const excerpt = content.substring(0, 200).trim() + '...';

      // Extract keywords
      const keywords = extractKeywords(content);

      // Determine category
      const category = categorizeLegalContent(title, content);

      // Check HR relevance
      const onboardingRelevance = isHRRelevant(content, title);

      // Generate synonyms
      const synonyms = generateSynonyms(title);

      // Determine relevance tags
      const relevanceTags = this.generateRelevanceTags(content, title);

      return {
        category,
        lawTitle: title,
        excerpt,
        sourceUrl,
        fullText: content.substring(0, 50000), // Limit to 50k characters
        keywords,
        relevanceTags,
        onboardingRelevance,
        useInClarification: onboardingRelevance,
        synonyms
      };
    } catch (error) {
      console.error('Error creating legal document:', error);
      return null;
    }
  }

  /**
   * Extracts title from legal content
   */
  private extractTitle(content: string): string | null {
    const titlePatterns = [
      /^([A-Z][A-Za-z\s]+(?:Act|Akta)\s+\d+(?:\s+of\s+\d{4})?)/,
      /(?:^|\n)([A-Z][A-Za-z\s]+(?:Act|Akta)[^\n]*)/,
      /(?:^|\n)((?:Section|Seksyen)\s+\d+[^\n]*)/,
      /(?:^|\n)([A-Z][A-Z\s]{10,})/
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: Use first line if it looks like a title
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 10 && firstLine.length < 100) {
      return firstLine;
    }

    return null;
  }

  /**
   * Generates relevance tags based on content analysis
   */
  private generateRelevanceTags(content: string, title: string): string[] {
    const text = (content + ' ' + title).toLowerCase();
    const tags: string[] = [];

    // Property and real estate tags
    if (/strata|property|building|management|maintenance/.test(text)) {
      tags.push('property', 'HR onboarding');
    }

    // Employment and HR tags
    if (/employment|employee|worker|salary|leave|termination/.test(text)) {
      tags.push('HR onboarding', 'compliance');
    }

    // Company and corporate tags
    if (/company|corporation|business|registration|ssm/.test(text)) {
      tags.push('HR onboarding', 'compliance');
    }

    // Data protection tags
    if (/data|privacy|pdpa|personal|protection/.test(text)) {
      tags.push('compliance', 'HR onboarding');
    }

    // Audit and compliance tags
    if (/audit|compliance|internal|procedure|standard/.test(text)) {
      tags.push('compliance');
    }

    return [...new Set(tags)];
  }

  /**
   * Gets processing statistics
   */
  getProcessingStats() {
    return {
      lawsParsed: this.processedCount,
      docsUploaded: this.processedCount,
      lastUpdated: new Date().toISOString(),
      sourcesProcessed: this.sourcesProcessed
    };
  }
}

/**
 * Predefined Malaysian legal content for immediate ingestion
 */
export const MALAYSIAN_LEGAL_CONTENT = [
  {
    title: "Strata Management Act 2013 (Act 757)",
    category: "Strata Management",
    content: `The Strata Management Act 2013 provides for the proper maintenance and management of buildings and common property. This Act establishes the framework for strata management corporations and joint management bodies.

Section 21 - Duties and powers of management corporation
The management corporation shall maintain and manage the common property and keep it in a state of good and serviceable repair. The corporation has the power to determine and impose charges for maintenance and management of the common property.

Section 59 - Strata Management Tribunal
A Strata Management Tribunal is established to hear and determine disputes related to strata management matters including maintenance charges, by-laws enforcement, and common property issues.

Section 17A - Issuance of Strata Titles
The developer has a duty to apply for strata titles for a subdivided building or land within the prescribed time frame after completion of construction.`,
    sourceUrl: "https://lom.agc.gov.my/act-view.php?type=print&act=757",
    keywords: ["strata", "management", "corporation", "common property", "maintenance", "tribunal", "titles"],
    hrRelevant: true
  },
  {
    title: "Personal Data Protection Act 2010 (Act 709)",
    category: "Data Protection",
    content: `The Personal Data Protection Act 2010 regulates the processing of personal data in commercial transactions and provides protection for data subjects.

Section 5 - General Principle
Personal data shall not be processed unless the data user has obtained the consent of the data subject or the processing is necessary for compliance with legal obligations.

Section 6 - Notice and Choice Principle
Data users must inform data subjects of the purpose for which their personal data is being collected and to whom it may be disclosed. Data subjects have the right to choose whether to provide their personal data.

Section 29 - Data Protection Officer
Organizations processing personal data must appoint a data protection officer to ensure compliance with the Act and to serve as a point of contact for data protection inquiries.`,
    sourceUrl: "https://lom.agc.gov.my/act-view.php?type=print&act=709",
    keywords: ["personal data", "protection", "privacy", "consent", "processing", "data subject", "compliance"],
    hrRelevant: true
  },
  {
    title: "Employment Act 1955 (Act 265)",
    category: "Employment Law",
    content: `The Employment Act 1955 governs the rights and obligations of employees and employers in Malaysia, establishing minimum standards for employment conditions.

Section 60 - Termination of Contract
An employer may terminate an employee's contract by giving written notice or payment in lieu of notice. The notice period varies based on the length of service.

Section 12 - Annual Leave
Every employee is entitled to paid annual leave which increases with length of service. The minimum annual leave is 8 days for employees with less than 2 years of service.

Section 37 - Working Hours
Normal working hours shall not exceed 8 hours per day or 48 hours per week. Overtime work beyond these limits requires additional compensation.`,
    sourceUrl: "https://lom.agc.gov.my/act-view.php?type=print&act=265",
    keywords: ["employment", "termination", "annual leave", "working hours", "overtime", "contract", "employee rights"],
    hrRelevant: true
  },
  {
    title: "Companies Act 2016 (Act 777)",
    category: "Corporate Law",
    content: `The Companies Act 2016 governs the incorporation, administration, and dissolution of companies in Malaysia, replacing the previous Companies Act 1965.

Section 13 - Company Registration
A company is formed by the registration of its constitution with the Registrar. The constitution must comply with the prescribed requirements and include the company's name, registered office, and share structure.

Section 199 - Directors' Duties
Directors have a duty to act in good faith and in the best interests of the company. They must exercise reasonable care, skill, and diligence in carrying out their duties.

Section 588 - Annual Returns
Every company must file an annual return with the Companies Commission within 30 days after each anniversary of its incorporation.`,
    sourceUrl: "https://lom.agc.gov.my/act-view.php?type=print&act=777",
    keywords: ["companies", "registration", "directors", "duties", "annual return", "incorporation", "constitution"],
    hrRelevant: true
  },
  {
    title: "Occupational Safety and Health Act 1994 (Act 514)",
    category: "Workplace Safety",
    content: `The Occupational Safety and Health Act 1994 aims to secure the safety, health, and welfare of persons at work and protect others against risks to safety or health.

Section 15 - General Duties of Employers
Every employer shall ensure, so far as is practicable, the safety, health, and welfare at work of all employees. This includes providing safe systems of work and maintaining safe working environments.

Section 16 - General Duties of Employees
Every employee shall take reasonable care for the safety and health of persons who may be affected by their acts or omissions at work, and cooperate with the employer in safety matters.

Section 17 - Safety and Health Committee
In workplaces with 40 or more employees, employers must establish a safety and health committee to promote cooperation between management and employees on safety matters.`,
    sourceUrl: "https://lom.agc.gov.my/act-view.php?type=print&act=514",
    keywords: ["occupational safety", "health", "workplace", "employer duties", "employee duties", "safety committee"],
    hrRelevant: true
  }
];

/**
 * Processes predefined Malaysian legal content
 */
export async function ingestPredefinedLegalContent(): Promise<number> {
  const processor = new LegalContentProcessor();
  let totalProcessed = 0;

  for (const content of MALAYSIAN_LEGAL_CONTENT) {
    const document: Omit<LegalDocument, 'id' | 'createdAt' | 'lastUpdated'> = {
      category: content.category,
      lawTitle: content.title,
      excerpt: content.content.substring(0, 200) + '...',
      sourceUrl: content.sourceUrl,
      fullText: content.content,
      keywords: content.keywords,
      relevanceTags: content.hrRelevant ? ['HR onboarding', 'compliance'] : ['compliance'],
      onboardingRelevance: content.hrRelevant,
      useInClarification: content.hrRelevant,
      synonyms: generateSynonyms(content.title)
    };

    await saveLegalDocument(document);
    totalProcessed++;
  }

  console.log(`Successfully ingested ${totalProcessed} predefined legal documents`);
  return totalProcessed;
}