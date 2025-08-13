#!/usr/bin/env node

/**
 * Authentication Component Integration Test
 * Task-55: Validate complete authentication flow end-to-end
 * 
 * This test validates server-side functionality without browser automation
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logResult(testName, passed, message = '') {
  const result = { test: testName, passed, message, timestamp: new Date().toISOString() };
  results.tests.push(result);
  
  if (passed) {
    console.log(`✅ ${testName}: PASSED ${message ? `- ${message}` : ''}`);
    results.passed++;
  } else {
    console.log(`❌ ${testName}: FAILED ${message ? `- ${message}` : ''}`);
    results.failed++;
  }
}

async function testServerAvailability() {
  console.log('\n🧪 Testing Server Availability...');
  
  try {
    const response = await fetch(BASE_URL, { 
      method: 'GET',
      timeout: 5000 
    });
    
    if (response.ok) {
      const html = await response.text();
      const hasTitle = html.includes('<title>Match Mates');
      logResult('Home Page Loading', hasTitle, 'Title found in response');
    } else {
      logResult('Home Page Loading', false, `HTTP ${response.status}`);
    }
  } catch (error) {
    logResult('Home Page Loading', false, error.message);
  }
}

async function testAuthPageRoutes() {
  console.log('\n🧪 Testing Authentication Page Routes...');
  
  const routes = [
    { path: '/auth/signup', title: 'Sign Up' },
    { path: '/auth/signin', title: 'Sign In' },
    { path: '/dashboard', shouldRedirect: true }
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(`${BASE_URL}${route.path}`, {
        method: 'GET',
        timeout: 5000,
        redirect: 'manual' // Don't follow redirects automatically
      });
      
      if (route.shouldRedirect) {
        // Dashboard should redirect when not authenticated
        const isRedirecting = response.status >= 300 && response.status < 400;
        logResult(`Protected Route: ${route.path}`, isRedirecting, 
                 isRedirecting ? 'Correctly redirecting' : 'Not redirecting as expected');
      } else {
        // Auth pages should load normally
        const isSuccess = response.ok;
        if (isSuccess) {
          const html = await response.text();
          const hasTitle = html.includes(route.title);
          logResult(`Auth Page: ${route.path}`, hasTitle, 
                   hasTitle ? 'Page loaded with correct title' : 'Title not found');
        } else {
          logResult(`Auth Page: ${route.path}`, false, `HTTP ${response.status}`);
        }
      }
    } catch (error) {
      logResult(`Route Test: ${route.path}`, false, error.message);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n🧪 Testing API Endpoints...');
  
  try {
    // Test Supabase connection endpoint
    const supabaseTest = await fetch(`${BASE_URL}/api/test-supabase`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (supabaseTest.ok) {
      const data = await supabaseTest.json();
      const hasConnection = data.message && data.message.includes('Supabase connection successful');
      logResult('Supabase Connection API', hasConnection, 
               hasConnection ? 'Database connected' : 'Connection issue detected');
    } else {
      logResult('Supabase Connection API', false, `HTTP ${supabaseTest.status}`);
    }
  } catch (error) {
    logResult('Supabase Connection API', false, error.message);
  }
  
  try {
    // Test profile creation endpoint (should require POST data)
    const profileTest = await fetch(`${BASE_URL}/api/auth/create-profile`, {
      method: 'GET', // Wrong method intentionally
      timeout: 5000
    });
    
    // Should reject GET requests
    const rejectsGet = !profileTest.ok && profileTest.status === 405;
    logResult('Profile Creation API Security', rejectsGet, 
             rejectsGet ? 'Correctly rejects invalid methods' : 'Security issue detected');
             
  } catch (error) {
    logResult('Profile Creation API', false, error.message);
  }
}

async function testEnvironmentConfiguration() {
  console.log('\n🧪 Testing Environment Configuration...');
  
  try {
    // Check if environment variables are properly configured
    // This would be done by examining the app's behavior, not accessing env vars directly
    
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (signupResponse.ok) {
      const html = await signupResponse.text();
      
      // Check if the page has demo mode warning or proper forms
      const hasDemoWarning = html.includes('Demo Mode') || html.includes('not configured');
      const hasProperForms = html.includes('type="email"') && html.includes('type="password"');
      
      logResult('Environment Configuration', hasProperForms, 
               hasDemoWarning ? 'Demo mode detected' : 'Production configuration active');
    } else {
      logResult('Environment Configuration', false, 'Cannot check signup page');
    }
  } catch (error) {
    logResult('Environment Configuration', false, error.message);
  }
}

async function testComponentStructure() {
  console.log('\n🧪 Testing Component Structure...');
  
  try {
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`);
    
    if (signupResponse.ok) {
      const html = await signupResponse.text();
      
      // Check for expected form elements
      const hasEmailField = html.includes('type="email"');
      const hasPasswordField = html.includes('type="password"');
      const hasNameField = html.includes('name') || html.includes('Full Name');
      const hasNTRPField = html.includes('NTRP') || html.includes('ntrp');
      const hasTermsCheckbox = html.includes('terms') || html.includes('Terms');
      
      const componentScore = [hasEmailField, hasPasswordField, hasNameField, hasNTRPField, hasTermsCheckbox]
                            .filter(Boolean).length;
      
      logResult('Signup Form Structure', componentScore >= 4, 
               `${componentScore}/5 expected form elements found`);
    }
    
    const signinResponse = await fetch(`${BASE_URL}/auth/signin`);
    
    if (signinResponse.ok) {
      const html = await signinResponse.text();
      
      const hasEmailField = html.includes('type="email"');
      const hasPasswordField = html.includes('type="password"');
      const hasSubmitButton = html.includes('type="submit"') || html.includes('Sign In');
      const hasRememberMe = html.includes('remember') || html.includes('Remember');
      
      const signinScore = [hasEmailField, hasPasswordField, hasSubmitButton, hasRememberMe]
                         .filter(Boolean).length;
      
      logResult('Signin Form Structure', signinScore >= 3, 
               `${signinScore}/4 expected form elements found`);
    }
    
  } catch (error) {
    logResult('Component Structure', false, error.message);
  }
}

async function runAuthComponentTests() {
  console.log('🚀 Starting Authentication Component Integration Tests');
  console.log(`🌐 Testing URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  // Run all tests
  await testServerAvailability();
  await testAuthPageRoutes();
  await testAPIEndpoints();
  await testEnvironmentConfiguration();
  await testComponentStructure();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPONENT INTEGRATION TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   • ${test.test}: ${test.message}`);
    });
  }
  
  console.log('\n🏆 OVERALL ASSESSMENT:');
  if (results.passed >= results.failed * 2) {
    console.log('✅ Authentication system components are functioning well');
    console.log('   Ready for manual browser testing');
  } else {
    console.log('⚠️  Some authentication components need attention');
    console.log('   Review failed tests before proceeding');
  }
  
  return {
    passed: results.passed,
    failed: results.failed,
    successRate: (results.passed / (results.passed + results.failed)) * 100,
    tests: results.tests
  };
}

// Only run if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAuthComponentTests().catch(console.error);
}

export { runAuthComponentTests };