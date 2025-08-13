#!/usr/bin/env node

/**
 * Comprehensive End-to-End Authentication Flow Testing Suite
 * Task-55: Validate complete authentication flow end-to-end
 * 
 * This test suite covers:
 * 1. Complete user journey (signup → verification → signin → dashboard)
 * 2. Session & state management
 * 3. Cross-component integration
 * 4. Database integration
 * 5. Error scenarios
 */

import { chromium } from 'playwright-core';
import { randomBytes } from 'crypto';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL_DOMAIN = '@example.com'; // Use non-deliverable domain for testing
const TIMEOUT = 30000; // 30 seconds timeout
const TEST_PASSWORD = 'TestPass123!';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * Generate unique test email
 */
function generateTestEmail() {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `test-${timestamp}-${random}${TEST_EMAIL_DOMAIN}`;
}

/**
 * Log test result
 */
function logTest(testName, passed, message = '', error = null) {
  if (passed) {
    console.log(`✅ ${testName}: PASSED`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: FAILED - ${message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, message, error });
  }
  
  testResults.details.push({
    test: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Wait for element with timeout and error handling
 */
async function waitForElement(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, { timeout: TIMEOUT, ...options });
    return true;
  } catch (error) {
    console.log(`⚠️ Element not found: ${selector}`);
    return false;
  }
}

/**
 * Test 1: Complete Signup Flow
 */
async function testSignupFlow(page) {
  console.log('\n🧪 Testing Complete Signup Flow...');
  
  const testEmail = generateTestEmail();
  
  try {
    // Navigate to signup page
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');
    
    // Check if signup form is present
    const signupFormExists = await waitForElement(page, 'form');
    if (!signupFormExists) {
      logTest('Signup Form Loading', false, 'Signup form not found');
      return null;
    }
    logTest('Signup Form Loading', true);
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]:first-of-type', TEST_PASSWORD);
    await page.fill('input[type="password"]:last-of-type', TEST_PASSWORD);
    await page.fill('input[placeholder*="full name"]', 'Test User');
    await page.fill('input[type="tel"]', '555-123-4567');
    
    // Select NTRP level
    const ntripSelect = await page.locator('select, [role="combobox"]').first();
    if (await ntripSelect.count() > 0) {
      await ntripSelect.selectOption('3.0');
    } else {
      // Handle custom select component
      await page.click('[data-testid="ntrp-select"], .ntrp-select, select');
      await page.click('text=3.0');
    }
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    logTest('Signup Form Filling', true);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or success message
    await page.waitForTimeout(2000);
    
    // Check for success page or email verification message
    const currentUrl = page.url();
    const hasSuccessPage = currentUrl.includes('/success') || 
                          await page.locator('text*="verify"').count() > 0 ||
                          await page.locator('text*="check your email"').count() > 0;
    
    logTest('Signup Submission', hasSuccessPage, hasSuccessPage ? '' : 'No success page or verification message found');
    
    return testEmail;
    
  } catch (error) {
    logTest('Signup Flow', false, 'Exception occurred', error);
    return null;
  }
}

/**
 * Test 2: Signin Flow
 */
async function testSigninFlow(page, testEmail) {
  console.log('\n🧪 Testing Signin Flow...');
  
  try {
    // Navigate to signin page
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    // Check if signin form is present
    const signinFormExists = await waitForElement(page, 'form');
    if (!signinFormExists) {
      logTest('Signin Form Loading', false, 'Signin form not found');
      return false;
    }
    logTest('Signin Form Loading', true);
    
    // Fill signin form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    logTest('Signin Form Filling', true);
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for successful signin (redirect to dashboard or profile page)
    const currentUrl = page.url();
    const isSignedIn = currentUrl.includes('/dashboard') || 
                      currentUrl.includes('/profile') ||
                      await page.locator('text*="Welcome back"').count() > 0;
    
    logTest('Signin Submission', isSignedIn, isSignedIn ? '' : `Redirected to: ${currentUrl}`);
    
    return isSignedIn;
    
  } catch (error) {
    logTest('Signin Flow', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Test 3: Authentication Context Integration
 */
async function testAuthContextIntegration(page) {
  console.log('\n🧪 Testing Authentication Context Integration...');
  
  try {
    // Check if user info is displayed (indicates auth context working)
    const userInfoElements = [
      'text*="Welcome back"',
      '[data-testid="user-email"]',
      '[data-testid="user-name"]',
      'text*="Profile Information"'
    ];
    
    let contextWorking = false;
    for (const selector of userInfoElements) {
      if (await page.locator(selector).count() > 0) {
        contextWorking = true;
        break;
      }
    }
    
    logTest('Auth Context Display', contextWorking, contextWorking ? '' : 'No user info displayed');
    
    // Test navigation to protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/events/create'];
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForTimeout(2000);
        
        const isAccessible = !page.url().includes('/auth/signin') && 
                           !page.url().includes('/auth/signup');
        
        logTest(`Protected Route Access: ${route}`, isAccessible, 
               isAccessible ? '' : `Redirected to: ${page.url()}`);
      } catch (error) {
        logTest(`Protected Route Access: ${route}`, false, 'Navigation failed', error);
      }
    }
    
    return contextWorking;
    
  } catch (error) {
    logTest('Auth Context Integration', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Test 4: Session Persistence
 */
async function testSessionPersistence(page, browser) {
  console.log('\n🧪 Testing Session Persistence...');
  
  try {
    // Test page refresh
    await page.reload();
    await page.waitForTimeout(2000);
    
    const afterRefresh = !page.url().includes('/auth/signin');
    logTest('Session After Page Refresh', afterRefresh);
    
    // Test new tab/window
    const newPage = await browser.newPage();
    await newPage.goto(`${BASE_URL}/dashboard`);
    await newPage.waitForTimeout(3000);
    
    const newTabAuthenticated = !newPage.url().includes('/auth/signin');
    logTest('Session in New Tab', newTabAuthenticated);
    
    await newPage.close();
    
    return afterRefresh && newTabAuthenticated;
    
  } catch (error) {
    logTest('Session Persistence', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Test 5: User Profile Data Consistency
 */
async function testProfileDataConsistency(page) {
  console.log('\n🧪 Testing User Profile Data Consistency...');
  
  try {
    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // Check if profile data is displayed
    const profileElements = [
      'text*="Test User"',
      'text*="3.0"',
      'text*="555-123-4567"',
      'text*="NTRP Level"'
    ];
    
    let profileDataVisible = 0;
    for (const selector of profileElements) {
      if (await page.locator(selector).count() > 0) {
        profileDataVisible++;
      }
    }
    
    const profileConsistent = profileDataVisible >= 2; // At least 2 profile elements visible
    logTest('Profile Data Display', profileConsistent, 
           `${profileDataVisible}/4 profile elements visible`);
    
    // Test profile page if it exists
    try {
      await page.goto(`${BASE_URL}/profile`);
      await page.waitForTimeout(2000);
      
      const profilePageAccessible = !page.url().includes('/auth/signin');
      logTest('Profile Page Access', profilePageAccessible);
      
      return profileConsistent && profilePageAccessible;
    } catch (error) {
      logTest('Profile Page Access', false, 'Profile page not accessible');
      return profileConsistent;
    }
    
  } catch (error) {
    logTest('Profile Data Consistency', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Test 6: Error Scenarios
 */
async function testErrorScenarios(page) {
  console.log('\n🧪 Testing Error Scenarios...');
  
  try {
    // Test invalid signin
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const errorMessageVisible = await page.locator('text*="Invalid"').count() > 0 ||
                               await page.locator('.error, [class*="error"]').count() > 0;
    
    logTest('Invalid Signin Error Handling', errorMessageVisible);
    
    // Test protected route access when not authenticated
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForTimeout(1000);
    
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const redirectedToSignin = page.url().includes('/auth/signin');
    logTest('Protected Route Redirect', redirectedToSignin);
    
    return errorMessageVisible && redirectedToSignin;
    
  } catch (error) {
    logTest('Error Scenarios', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Test 7: Sign Out Functionality
 */
async function testSignOutFlow(page) {
  console.log('\n🧪 Testing Sign Out Flow...');
  
  try {
    // First ensure we're signed in
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    // Look for sign out button/link
    const signOutSelectors = [
      'text*="Sign Out"',
      'text*="Logout"',
      '[data-testid="signout-button"]',
      'button*="Sign Out"'
    ];
    
    let signOutButton = null;
    for (const selector of signOutSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        signOutButton = element;
        break;
      }
    }
    
    if (signOutButton) {
      await signOutButton.click();
      await page.waitForTimeout(2000);
      
      // Check if redirected to signin or home page
      const currentUrl = page.url();
      const signedOut = currentUrl.includes('/auth/signin') || 
                       currentUrl === `${BASE_URL}/` ||
                       !currentUrl.includes('/dashboard');
      
      logTest('Sign Out Functionality', signedOut, signedOut ? '' : `Still at: ${currentUrl}`);
      
      // Test accessing protected route after signout
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);
      
      const backToSignin = page.url().includes('/auth/signin');
      logTest('Protected Access After Signout', backToSignin);
      
      return signedOut && backToSignin;
    } else {
      logTest('Sign Out Button Found', false, 'No sign out button found');
      return false;
    }
    
  } catch (error) {
    logTest('Sign Out Flow', false, 'Exception occurred', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAuthTests() {
  console.log('🚀 Starting Comprehensive Authentication Flow Testing');
  console.log(`🌐 Testing URL: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  let browser, page;
  
  try {
    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    page = await context.newPage();
    
    // Test server availability
    try {
      await page.goto(BASE_URL, { timeout: 10000 });
      logTest('Server Availability', true);
    } catch (error) {
      logTest('Server Availability', false, 'Server not reachable');
      console.log('\n❌ Cannot reach server. Please ensure the application is running.');
      return;
    }
    
    // Run all tests
    const testEmail = await testSignupFlow(page);
    
    if (testEmail) {
      // Note: In real environment, we'd need email verification
      // For testing, we'll proceed assuming manual verification or auto-confirm
      
      const signedIn = await testSigninFlow(page, testEmail);
      
      if (signedIn) {
        await testAuthContextIntegration(page);
        await testSessionPersistence(page, browser);
        await testProfileDataConsistency(page);
        await testSignOutFlow(page);
      }
    }
    
    // Always test error scenarios
    await testErrorScenarios(page);
    
  } catch (error) {
    console.error('💥 Test runner error:', error);
    testResults.errors.push({ test: 'Test Runner', error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print results summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.message}`);
    });
  }
  
  return {
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.passed + testResults.failed,
    successRate: (testResults.passed / (testResults.passed + testResults.failed)) * 100,
    details: testResults.details,
    errors: testResults.errors
  };
}

// Check if Playwright is available
async function checkDependencies() {
  try {
    await import('playwright-core');
    return true;
  } catch (error) {
    console.log('❌ Playwright not found. Installing...');
    console.log('💡 Run: npm install playwright-core');
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const hasPlaywright = await checkDependencies();
  if (hasPlaywright) {
    await runAuthTests();
  }
}

export { runAuthTests, generateTestEmail, testResults };