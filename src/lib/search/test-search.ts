/**
 * Test script for search infrastructure
 *
 * Run with: npx tsx src/lib/search/test-search.ts
 *
 * This script tests:
 * 1. Serper API connection
 * 2. Claude Agent with Serper tool
 * 3. Complete search flow with sample request
 */

import 'dotenv/config';
import { searchWithSerper, formatSerperResults } from './serper.js';
import {
  findWeekendActivities,
  findWeekendActivitiesStreaming,
} from './agent.js';
import type { SearchRequest, AgentStreamEvent } from './types.js';

/**
 * Test 1: Serper API Connection
 */
async function testSerperAPI() {
  console.log('\n🔍 TEST 1: Serper API Connection');
  console.log('='.repeat(60));

  try {
    console.log('Searching: "indoor playground Wrocław"...');

    const results = await searchWithSerper({
      q: 'indoor playground Wrocław',
      num: 5,
    });

    console.log('✅ Serper API connection successful!');
    console.log(`   Found ${results.organic?.length || 0} results`);

    if (results.organic && results.organic.length > 0) {
      console.log('\n   Top 3 results:');
      results.organic.slice(0, 3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.title}`);
        console.log(`      ${result.link}`);
      });
    }

    console.log('\n   Formatted results preview:');
    const formatted = formatSerperResults(results);
    console.log(formatted.substring(0, 500) + '...');

    return true;
  } catch (error) {
    console.error('❌ Serper API test failed:');
    console.error('   Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Test 2: Claude Agent (Non-streaming)
 */
async function testClaudeAgent() {
  console.log('\n🤖 TEST 2: Claude Agent (Non-streaming)');
  console.log('='.repeat(60));

  try {
    const searchRequest: SearchRequest = {
      city: 'Wrocław',
      dateRangeStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      dateRangeEnd: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // Weekend
      attendees: [
        { age: 35, role: 'adult' },
        { age: 5, role: 'child' },
        { age: 3, role: 'child' },
      ],
      preferences: 'Indoor activities, educational, family-friendly',
    };

    console.log('Search request:', JSON.stringify(searchRequest, null, 2));
    console.log('\nCalling Claude Agent...');
    console.log('(This may take 30-60 seconds as Claude makes multiple searches)');

    const startTime = Date.now();
    const recommendations = await findWeekendActivities(searchRequest);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Claude Agent completed in ${duration}s!`);
    console.log(`   Found ${recommendations.recommendations.length} recommendations`);
    console.log(`\n   Search Summary: ${recommendations.searchSummary}`);

    console.log('\n   Recommendations:');
    recommendations.recommendations.forEach((rec, i) => {
      console.log(`\n   ${i + 1}. ${rec.name} (${rec.category})`);
      console.log(`      Age Range: ${rec.ageRange}`);
      console.log(`      Location: ${rec.location.address}`);
      console.log(`      Pricing: ${rec.pricing.type}${rec.pricing.amount ? ' - ' + rec.pricing.amount : ''}`);
      console.log(`      Why: ${rec.whyRecommended}`);
    });

    if (recommendations.additionalNotes) {
      console.log(`\n   Notes: ${recommendations.additionalNotes}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Claude Agent test failed:');
    console.error('   Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

/**
 * Test 3: Claude Agent (Streaming)
 */
async function testClaudeAgentStreaming() {
  console.log('\n🎬 TEST 3: Claude Agent (Streaming)');
  console.log('='.repeat(60));

  try {
    const searchRequest: SearchRequest = {
      city: 'Wrocław',
      dateRangeStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateRangeEnd: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { age: 35, role: 'adult' },
        { age: 7, role: 'child' },
      ],
      preferences: 'Museums, outdoor activities',
    };

    console.log('Testing streaming events...\n');

    const events: AgentStreamEvent[] = [];

    const recommendations = await findWeekendActivitiesStreaming(
      searchRequest,
      (event) => {
        events.push(event);

        switch (event.type) {
          case 'start':
            console.log(`📍 ${event.message}`);
            break;
          case 'tool_use':
            console.log(`🔧 Tool: ${event.tool}`);
            console.log(`   Query: ${(event.input as any).query || 'N/A'}`);
            break;
          case 'tool_result':
            console.log(`✓ Tool result: ${event.result}`);
            break;
          case 'text_delta':
            console.log(`💬 ${event.text}`);
            break;
          case 'complete':
            console.log(`✅ Complete: ${event.recommendations.recommendations.length} recommendations`);
            break;
          case 'error':
            console.log(`❌ Error: ${event.error}`);
            break;
          case 'thinking':
            console.log(`🤔 ${event.text}`);
            break;
        }
      }
    );

    console.log(`\n✅ Streaming test completed!`);
    console.log(`   Total events: ${events.length}`);
    console.log(`   Recommendations: ${recommendations.recommendations.length}`);

    return true;
  } catch (error) {
    console.error('❌ Streaming test failed:');
    console.error('   Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Weekend Finder - Search Infrastructure Test Suite       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check environment variables
  console.log('\n🔑 Checking environment variables...');
  const hasAnthropicKey = !!(
    process.env.ANTHROPIC_API_KEY || (import.meta as any).env?.ANTHROPIC_API_KEY
  );
  const hasSerperKey = !!(
    process.env.SERPER_API_KEY || (import.meta as any).env?.SERPER_API_KEY
  );

  console.log(`   ANTHROPIC_API_KEY: ${hasAnthropicKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SERPER_API_KEY:    ${hasSerperKey ? '✅ Set' : '❌ Missing'}`);

  if (!hasAnthropicKey || !hasSerperKey) {
    console.error('\n❌ Missing required API keys. Please check your .env file.');
    console.error('   Required keys:');
    console.error('   - ANTHROPIC_API_KEY (get from https://console.anthropic.com/)');
    console.error('   - SERPER_API_KEY (get from https://serper.dev/)');
    process.exit(1);
  }

  const results = {
    serper: false,
    agent: false,
    streaming: false,
  };

  // Run tests sequentially
  try {
    results.serper = await testSerperAPI();
  } catch (error) {
    console.error('Unexpected error in Serper test:', error);
  }

  // Only run agent tests if Serper test passed
  if (results.serper) {
    try {
      results.agent = await testClaudeAgent();
    } catch (error) {
      console.error('Unexpected error in Claude Agent test:', error);
    }

    try {
      results.streaming = await testClaudeAgentStreaming();
    } catch (error) {
      console.error('Unexpected error in streaming test:', error);
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Test Results Summary                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n   Serper API:       ${results.serper ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Claude Agent:     ${results.agent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Streaming:        ${results.streaming ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = results.serper && results.agent && results.streaming;
  console.log(`\n   Overall:          ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  console.log('\n' + '='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Unexpected error in test runner:');
  console.error(error);
  process.exit(1);
});
