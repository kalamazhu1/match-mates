#!/usr/bin/env node

/**
 * Test script to verify Supabase connection
 * Run with: node scripts/test-supabase-connection.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Environment variables not configured properly');
    console.log('Missing variables:');
    if (!supabaseUrl) console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('\n💡 Please update your .env.local file with your Supabase credentials');
    console.log('📖 See README.md for setup instructions');
    process.exit(1);
  }

  if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
    console.error('❌ Environment variables contain placeholder values');
    console.log('🔧 Please replace the placeholder values in .env.local with your actual Supabase credentials');
    console.log('📖 See README.md for setup instructions');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('\n🔄 Testing connection...');
    
    // Test basic connection by checking if we can query the auth users (should be empty but not error)
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to Supabase');
    
    // Test a simple query to verify database access
    console.log('\n🔄 Testing database access...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Database query test failed (this might be expected if tables don\'t exist yet):');
      console.log('   ', testError.message);
      console.log('💡 Run database migrations to create the tables');
    } else {
      console.log('✅ Database access working');
    }
    
    console.log('\n🎉 Supabase connection test completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Run database migrations: npm run db:migrate');
    console.log('   2. Start the development server: npm run dev');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testSupabaseConnection();