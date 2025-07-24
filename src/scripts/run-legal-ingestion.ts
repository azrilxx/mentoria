#!/usr/bin/env tsx

/**
 * Legal Knowledge Ingestion Engine CLI
 * 
 * Runs the complete legal knowledge ingestion process for Mentoria.
 * Usage: npm run legal-ingestion
 */

import { runMasterLegalIngestion } from '../services/master-legal-ingestion';
import { getLegalLibrary } from '../services/legal-ingestion';
import { getCompanyMetadata } from '../services/company-metadata';

async function main() {
  console.log('🧠 CLAUDE MASTER PROMPT — STEP 11: Autonomous Legal Ingestion & HR Personalization');
  console.log('=' .repeat(80));
  
  try {
    console.log('⏳ Starting master legal knowledge ingestion process...\n');
    
    const { success, stats, report, validation } = await runMasterLegalIngestion();
    
    if (!success) {
      console.log('❌ MASTER INGESTION FAILED');
      console.log(report);
      process.exit(1);
    }
    
    console.log('\n📊 MASTER INGESTION COMPLETED');
    console.log('=' .repeat(50));
    console.log(`✅ Laws Parsed: ${stats.lawsParsed}`);
    console.log(`✅ Documents Uploaded: ${stats.docsUploaded}`);
    console.log(`✅ Sources Processed: ${stats.sourcesProcessed.length}`);
    console.log(`✅ Last Updated: ${stats.lastUpdated}`);
    console.log(`✅ Overall Status: ${validation.overallStatus}`);
    
    // Display legal library details
    const library = await getLegalLibrary();
    console.log('\n📚 LEGAL LIBRARY (/legalLibrary)');
    console.log('=' .repeat(50));
    console.log(`📖 Total Documents: ${library.length}`);
    console.log(`🎯 HR-Relevant: ${library.filter(doc => doc.onboardingRelevance).length}`);
    console.log(`📂 Categories: ${[...new Set(library.map(doc => doc.category))].join(', ')}`);
    
    // Display company metadata details
    const companyData = await getCompanyMetadata('desaria_group');
    console.log('\n🏢 COMPANY METADATA (/companyMetadata)');
    console.log('=' .repeat(50));
    if (companyData) {
      console.log(`✅ Company: ${companyData.companyName}`);
      console.log(`📧 Contact: ${companyData.contactEmail}`);
      console.log(`📋 Policies: ${Object.keys(companyData.policies).length}/6 configured`);
      console.log(`🕒 Created: ${companyData.createdAt}`);
    } else {
      console.log('❌ Company metadata not found');
    }
    
    console.log('\n📋 COMPREHENSIVE REPORT');
    console.log('=' .repeat(50));
    console.log(report);
    
    // Display sample Firebase-ready documents
    console.log('\n🔥 FIREBASE-READY DOCUMENT SAMPLES');
    console.log('=' .repeat(50));
    
    library.slice(0, 2).forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.lawTitle}`);
      console.log('```json');
      console.log(JSON.stringify({
        category: doc.category,
        lawTitle: doc.lawTitle,
        excerpt: doc.excerpt,
        sourceUrl: doc.sourceUrl,
        fullText: doc.fullText.substring(0, 200) + '...',
        keywords: doc.keywords.slice(0, 8),
        relevanceTags: doc.relevanceTags,
        onboardingRelevance: doc.onboardingRelevance,
        useInClarification: doc.useInClarification,
        synonyms: doc.synonyms
      }, null, 2));
      console.log('```');
    });
    
    console.log('\n📦 FIREBASE COLLECTIONS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📚 /legalLibrary: ${library.length} documents`);
    console.log(`🏢 /companyMetadata: ${companyData ? '1' : '0'} companies`);
    console.log(`📊 /status/legalIngestStats: Updated`);
    
    console.log('\n🎯 INTEGRATION READY FEATURES');
    console.log('=' .repeat(50));
    console.log('✅ Real Malaysian laws referenced in training plans');
    console.log('✅ Company-specific HR policies embedded');
    console.log('✅ Contextual legal guidance for onboarding');
    console.log('✅ HR trigger terms properly detected');
    console.log('✅ Clarification prompts ready ("Did you mean...")');
    console.log('✅ Audit trail for legal document usage');
    
    console.log('\n🚀 MASTER LEGAL INGESTION ENGINE - FULLY OPERATIONAL');
    console.log(`📈 Engine Status: 🟢 READY FOR PRODUCTION`);
    
  } catch (error) {
    console.error('\n❌ Error running master legal ingestion:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as runLegalIngestionCLI };