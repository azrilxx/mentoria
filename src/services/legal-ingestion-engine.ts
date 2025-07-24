import { 
  IngestionStats, 
  updateIngestionStats, 
  getLegalLibrary,
  clearLegalLibrary 
} from './legal-ingestion';
import { 
  LegalContentProcessor, 
  ingestPredefinedLegalContent 
} from './legal-scraper';

/**
 * Main Legal Knowledge Ingestion Engine for Mentoria
 * 
 * Autonomously scrapes, extracts, structures, and uploads Malaysian legal 
 * and regulatory knowledge into Firebase for use by the Mentoria app.
 */
export class LegalIngestionEngine {
  private processor: LegalContentProcessor;
  private stats: IngestionStats;

  constructor() {
    this.processor = new LegalContentProcessor();
    this.stats = {
      lawsParsed: 0,
      docsUploaded: 0,
      lastUpdated: new Date().toISOString(),
      sourcesProcessed: []
    };
  }

  /**
   * Main execution method - runs the complete ingestion process
   */
  async execute(): Promise<IngestionStats> {
    console.log('🚀 Starting Legal Knowledge Ingestion Engine...');
    
    try {
      // Clear existing data for fresh ingestion
      await clearLegalLibrary();
      console.log('📝 Cleared existing legal library');

      // Step 1: Ingest predefined Malaysian legal content
      console.log('📚 Ingesting predefined Malaysian legal content...');
      const predefinedCount = await ingestPredefinedLegalContent();
      
      // Step 2: Process web-scraped content (simulate for now)
      console.log('🌐 Processing web-scraped legal content...');
      await this.processWebScrapedContent();

      // Step 3: Update statistics
      const finalStats = this.processor.getProcessingStats();
      finalStats.lawsParsed += predefinedCount;
      finalStats.docsUploaded += predefinedCount;
      
      this.stats = finalStats;
      await updateIngestionStats(this.stats);

      console.log('✅ Legal knowledge ingestion completed successfully!');
      console.log(`📊 Final Statistics:`, this.stats);

      return this.stats;
    } catch (error) {
      console.error('❌ Error during legal knowledge ingestion:', error);
      throw error;
    }
  }

  /**
   * Processes content from web scraping (currently using simulated content)
   */
  private async processWebScrapedContent(): Promise<void> {
    // Simulated content from Malaysian government sources
    const webScrapedContent = [
      {
        content: `Strata Management Tribunal Guidelines

The Strata Management Tribunal has jurisdiction to hear disputes between management corporations, joint management bodies, and parcel owners. Common dispute categories include:

1. Maintenance charge disputes
2. By-law enforcement issues  
3. Common property usage conflicts
4. Insurance claim disagreements

The tribunal provides an accessible and cost-effective alternative to court proceedings for strata-related disputes. Filing fees are minimal and proceedings are designed to be user-friendly.

Key procedures:
- File application within prescribed time limits
- Attend mediation session if required
- Present case at tribunal hearing
- Comply with tribunal orders

For more information, visit the official tribunal portal at https://etps.kpkt.gov.my/`,
        sourceUrl: 'https://www.kpkt.gov.my/strata-tribunal-guidelines',
        sourceType: 'government'
      },
      {
        content: `Malaysian Anti-Corruption Commission (MACC) Guidelines for Corporate Compliance

Organizations must implement adequate procedures to prevent corruption and bribery. The guidelines establish requirements for:

1. Top-level commitment to integrity
2. Risk assessment procedures
3. Proportionate control measures
4. Due diligence on third parties
5. Communication and training programs
6. Monitoring and review systems

Companies should conduct regular compliance audits and maintain documentation of their anti-corruption efforts. Failure to implement adequate procedures may result in corporate liability under the Malaysian Anti-Corruption Commission Act.

Training programs should cover:
- Identification of corruption risks
- Proper gift and hospitality policies  
- Conflicts of interest management
- Whistleblowing procedures
- Record-keeping requirements`,
        sourceUrl: 'https://www.sprm.gov.my/corporate-compliance-guidelines',
        sourceType: 'government'
      },
      {
        content: `Employment Insurance System (EIS) Implementation Guidelines

The Employment Insurance System provides financial support and re-employment assistance to retrenched workers. Employers must:

1. Register with PERKESO within 7 days of commencing business
2. Contribute 0.2% of employee wages (shared equally with employees)
3. Submit monthly contributions by the 15th of the following month
4. Maintain accurate employee records
5. Notify PERKESO of employee terminations

Benefits for employees include:
- Job search allowance
- Early re-employment allowance  
- Reduced income allowance
- Training allowance
- Career counseling services

Non-compliance penalties:
- Late payment surcharge of 6% per annum
- Prosecution for failure to register
- Additional penalties for falsified records

For registration and submissions, use the PERKESO online portal at https://portal.perkeso.gov.my/`,
        sourceUrl: 'https://www.perkeso.gov.my/eis-guidelines',
        sourceType: 'government'
      }
    ];

    for (const item of webScrapedContent) {
      await this.processor.processLegalContent(
        item.content,
        item.sourceUrl,
        item.sourceType
      );
    }
  }

  /**
   * Gets current ingestion statistics
   */
  getStats(): IngestionStats {
    return this.stats;
  }

  /**
   * Validates the ingested legal library
   */
  async validateLibrary(): Promise<{ isValid: boolean; issues: string[] }> {
    const library = await getLegalLibrary();
    const issues: string[] = [];

    // Check minimum content requirements
    if (library.length < 5) {
      issues.push(`Insufficient legal documents: ${library.length} (minimum 5 required)`);
    }

    // Check for required HR-relevant content
    const hrRelevantDocs = library.filter(doc => doc.onboardingRelevance);
    if (hrRelevantDocs.length < 3) {
      issues.push(`Insufficient HR-relevant documents: ${hrRelevantDocs.length} (minimum 3 required)`);
    }

    // Check for required categories
    const requiredCategories = ['Strata Management', 'Employment Law', 'Data Protection'];
    const presentCategories = [...new Set(library.map(doc => doc.category))];
    const missingCategories = requiredCategories.filter(cat => !presentCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      issues.push(`Missing required categories: ${missingCategories.join(', ')}`);
    }

    // Check document completeness
    for (const doc of library) {
      if (!doc.keywords || doc.keywords.length === 0) {
        issues.push(`Document "${doc.lawTitle}" missing keywords`);
      }
      if (!doc.sourceUrl) {
        issues.push(`Document "${doc.lawTitle}" missing source URL`);
      }
      if (doc.fullText.length < 100) {
        issues.push(`Document "${doc.lawTitle}" has insufficient content`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Generates a summary report of the ingestion process
   */
  async generateReport(): Promise<string> {
    const library = await getLegalLibrary();
    const validation = await this.validateLibrary();
    
    const categories = [...new Set(library.map(doc => doc.category))];
    const hrRelevantCount = library.filter(doc => doc.onboardingRelevance).length;
    const totalKeywords = library.reduce((sum, doc) => sum + doc.keywords.length, 0);

    return `
# Legal Knowledge Ingestion Report

## 📊 Summary Statistics
- **Total Documents Processed**: ${this.stats.lawsParsed}
- **Documents Successfully Uploaded**: ${this.stats.docsUploaded}
- **Sources Processed**: ${this.stats.sourcesProcessed.length}
- **Last Updated**: ${this.stats.lastUpdated}

## 📚 Content Breakdown
- **Categories Covered**: ${categories.length} (${categories.join(', ')})
- **HR-Relevant Documents**: ${hrRelevantCount}
- **Total Keywords Generated**: ${totalKeywords}
- **Average Keywords per Document**: ${Math.round(totalKeywords / library.length)}

## 🎯 HR Onboarding Coverage
${library.filter(doc => doc.onboardingRelevance).map(doc => `- ${doc.lawTitle}`).join('\n')}

## ✅ Validation Results
- **Status**: ${validation.isValid ? '✅ Valid' : '❌ Issues Found'}
- **Issues**: ${validation.issues.length === 0 ? 'None' : validation.issues.join('; ')}

## 🔗 Sample Documents
${library.slice(0, 3).map(doc => `
### ${doc.lawTitle}
- **Category**: ${doc.category}
- **Keywords**: ${doc.keywords.slice(0, 5).join(', ')}
- **HR Relevant**: ${doc.onboardingRelevance ? 'Yes' : 'No'}
- **Source**: ${doc.sourceUrl}
`).join('')}

## 🚀 Next Steps
1. Validate document accuracy with legal experts
2. Integrate with Mentoria's clarification prompts
3. Set up automated content updates
4. Monitor usage analytics
`;
  }
}

/**
 * Main entry point for running the legal ingestion engine
 */
export async function runLegalIngestion(): Promise<{
  stats: IngestionStats;
  report: string;
  validation: { isValid: boolean; issues: string[] };
}> {
  const engine = new LegalIngestionEngine();
  
  const stats = await engine.execute();
  const report = await engine.generateReport();
  const validation = await engine.validateLibrary();
  
  return { stats, report, validation };
}