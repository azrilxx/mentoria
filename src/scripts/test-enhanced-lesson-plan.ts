#!/usr/bin/env tsx

/**
 * Test script for enhanced lesson plan generation with legal library and company metadata
 * 
 * Tests the Step 12 integration of:
 * - Legal library documents (Malaysian laws)
 * - Company metadata (Desaria Group policies)
 * - Enhanced topic resolution
 * - Personalized training content
 */

import { generateTrackFromParams, getUnresolvedTopics } from '../ai/flows/enhanced-lesson-plan';
import { getLegalLibrary } from '../services/legal-ingestion';
import { getCompanyMetadata } from '../services/company-metadata';
import { runMasterLegalIngestion } from '../services/master-legal-ingestion';
import { DailyPlanSchema } from '@/lib/schemas';

/**
 * Simple plan parser for testing
 */
function testPlanParser(lessonPlan: string) {
  const lines = lessonPlan.split('\n');
  const dailyPlans: any[] = [];
  
  let currentDay: any = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect day headers
    if (trimmedLine.match(/^Day \d+:/)) {
      if (currentDay) {
        dailyPlans.push(currentDay);
      }
      currentDay = {
        day: dailyPlans.length + 1,
        title: trimmedLine,
        modules: [],
        sopLinks: []
      };
    }
    
    // Detect modules (bullet points)
    if (trimmedLine.startsWith('- ') && currentDay) {
      currentDay.modules.push({
        title: trimmedLine.substring(2),
        completed: false
      });
    }
  }
  
  // Add the last day
  if (currentDay) {
    dailyPlans.push(currentDay);
  }
  
  return dailyPlans;
}

/**
 * Test cases for enhanced lesson plan generation
 */
const TEST_CASES = [
  {
    name: "Employment Termination with Desaria Group",
    input: {
      trainingFocus: "termination",
      seniorityLevel: "Senior" as const,
      learningScope: "Functional Mastery" as const,
      duration: 5,
      companyId: "desaria_group",
      userId: "test_user_1",
      planParser: testPlanParser
    },
    expectedElements: [
      "Employment Act",
      "Desaria Group Policy",
      "1 month notice",
      "termination"
    ]
  },
  {
    name: "Strata Management Training",
    input: {
      trainingFocus: "strata",
      seniorityLevel: "Mid" as const,
      learningScope: "Basic Overview" as const,
      duration: 3,
      companyId: "desaria_group",
      userId: "test_user_2",
      planParser: testPlanParser
    },
    expectedElements: [
      "Strata Management",
      "building management",
      "common property"
    ]
  },
  {
    name: "Data Protection Compliance",
    input: {
      trainingFocus: "data protection",
      seniorityLevel: "Entry" as const,
      learningScope: "Basic Overview" as const,
      duration: 2,
      companyId: "desaria_group",
      userId: "test_user_3",
      planParser: testPlanParser
    },
    expectedElements: [
      "Personal Data Protection Act",
      "PDPA",
      "consent",
      "Desaria Group Policy"
    ]
  },
  {
    name: "Vague Topic Resolution Test",
    input: {
      trainingFocus: "audit",
      seniorityLevel: "Mid" as const,
      learningScope: "Functional Mastery" as const,
      duration: 5,
      companyId: "desaria_group",
      userId: "test_user_4",
      planParser: testPlanParser
    },
    expectedElements: [
      "audit",
      "compliance"
    ]
  }
];

/**
 * Runs a single test case
 */
async function runTestCase(testCase: typeof TEST_CASES[0]): Promise<{
  success: boolean;
  result?: any;
  error?: string;
  validationScore: number;
}> {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📋 Input: ${JSON.stringify(testCase.input, null, 2)}`);
  
  try {
    const result = await generateTrackFromParams(testCase.input);
    
    // Validate expected elements
    const lessonPlan = result.lessonPlan.toLowerCase();
    let foundElements = 0;
    
    for (const element of testCase.expectedElements) {
      if (lessonPlan.includes(element.toLowerCase())) {
        foundElements++;
        console.log(`✅ Found expected element: "${element}"`);
      } else {
        console.log(`❌ Missing expected element: "${element}"`);
      }
    }
    
    const validationScore = foundElements / testCase.expectedElements.length;
    
    console.log(`📊 Validation Score: ${Math.round(validationScore * 100)}%`);
    console.log(`📚 Legal References: ${result.legalReferences.length}`);
    console.log(`🏢 Company Policies: ${result.companyPolicies?.length || 0}`);
    console.log(`🎯 Clarified Topic: ${result.clarifiedTopic}`);
    
    return {
      success: true,
      result,
      validationScore
    };
    
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      validationScore: 0
    };
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧠 CLAUDE MASTER PROMPT — STEP 12 TEST: Enhanced Lesson Plan Generation');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Ensure legal library and company metadata are populated
    console.log('🔄 Setting up test environment...');
    await runMasterLegalIngestion();
    
    // Verify data availability
    const legalLibrary = await getLegalLibrary();
    const companyData = await getCompanyMetadata('desaria_group');
    
    console.log(`📚 Legal Library: ${legalLibrary.length} documents`);
    console.log(`🏢 Company Data: ${companyData ? 'Available' : 'Missing'}`);
    
    if (legalLibrary.length === 0) {
      throw new Error('Legal library is empty. Run legal ingestion first.');
    }
    
    if (!companyData) {
      throw new Error('Desaria Group company metadata not found.');
    }
    
    // Step 2: Run test cases
    console.log('\n🎯 Running Enhanced Lesson Plan Tests...');
    
    const testResults: any[] = [];
    
    for (const testCase of TEST_CASES) {
      const result = await runTestCase(testCase);
      testResults.push({
        name: testCase.name,
        ...result
      });
    }
    
    // Step 3: Generate summary report
    const successfulTests = testResults.filter(r => r.success).length;
    const averageScore = testResults.reduce((sum, r) => sum + r.validationScore, 0) / testResults.length;
    
    console.log('\n📊 TEST SUMMARY REPORT');
    console.log('=' .repeat(50));
    console.log(`✅ Successful Tests: ${successfulTests}/${testResults.length}`);
    console.log(`📈 Average Validation Score: ${Math.round(averageScore * 100)}%`);
    console.log(`🎯 Integration Status: ${averageScore >= 0.7 ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    
    // Step 4: Display sample enhanced lesson plan
    const bestTest = testResults.find(r => r.success && r.validationScore >= 0.7);
    if (bestTest && bestTest.result) {
      console.log('\n📋 SAMPLE ENHANCED LESSON PLAN');
      console.log('=' .repeat(50));
      console.log(`**Test Case:** ${bestTest.name}`);
      console.log(`**Clarified Topic:** ${bestTest.result.clarifiedTopic}`);
      console.log(`**Track ID:** ${bestTest.result.trackId}`);
      
      console.log('\n**Generated Content:**');
      console.log('```');
      console.log(bestTest.result.lessonPlan.substring(0, 1000) + '...');
      console.log('```');
      
      console.log('\n**Legal References:**');
      bestTest.result.legalReferences.forEach((ref: any, idx: number) => {
        console.log(`${idx + 1}. ${ref.lawTitle} (Score: ${ref.relevanceScore})`);
        console.log(`   Source: ${ref.sourceUrl}`);
      });
      
      if (bestTest.result.companyPolicies && bestTest.result.companyPolicies.length > 0) {
        console.log('\n**Company Policies Applied:**');
        bestTest.result.companyPolicies.forEach((policy: any, idx: number) => {
          console.log(`${idx + 1}. ${policy.policyType}: ${policy.policyText}`);
        });
      }
    }
    
    // Step 5: Check unresolved topics
    const unresolvedTopics = getUnresolvedTopics();
    if (unresolvedTopics.length > 0) {
      console.log('\n⚠️  UNRESOLVED TOPICS LOGGED');
      console.log('=' .repeat(50));
      unresolvedTopics.forEach((topic, idx) => {
        console.log(`${idx + 1}. Topic: "${topic.topic}"`);
        console.log(`   Reason: ${topic.reason}`);
        console.log(`   Time: ${topic.timestamp}`);
      });
    }
    
    console.log('\n🎉 STEP 12 INTEGRATION TEST COMPLETED');
    console.log(`🟢 Status: ${averageScore >= 0.7 ? 'READY FOR PRODUCTION' : 'NEEDS REFINEMENT'}`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { main as runEnhancedLessonPlanTests };