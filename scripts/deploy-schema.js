#!/usr/bin/env node

/**
 * Database Schema Deployment Script for Supabase
 * Deploys the schema.sql file to a Supabase instance
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'schema.sql');
const TIMEOUT_MS = 30000; // 30 seconds timeout for each SQL command

class SchemaDeployer {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ Missing required environment variables:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    // Use service role key for schema operations
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Read and parse the schema.sql file
   */
  readSchemaFile() {
    try {
      console.log('📖 Reading schema file...');
      const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8');
      
      // Split by semicolons and filter out empty statements
      const statements = schemaContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
        .map(stmt => stmt + ';'); // Add semicolon back

      console.log(`✅ Found ${statements.length} SQL statements to execute`);
      return statements;
    } catch (error) {
      console.error('❌ Error reading schema file:', error.message);
      process.exit(1);
    }
  }

  /**
   * Execute a single SQL statement with error handling
   */
  async executeStatement(statement, index) {
    try {
      // Use rpc to execute raw SQL for DDL operations
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // Try alternative method for certain statements
        if (statement.includes('CREATE EXTENSION') || 
            statement.includes('CREATE TABLE') || 
            statement.includes('CREATE POLICY') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('CREATE INDEX')) {
          
          // For these operations, we'll need to use the Supabase REST API
          // or handle them differently since rpc might not support all DDL
          console.warn(`⚠️  Statement ${index + 1} may require manual execution:`);
          console.warn(`   ${statement.substring(0, 100)}...`);
          return { success: false, warning: true, statement };
        }
        
        throw error;
      }

      console.log(`✅ Statement ${index + 1} executed successfully`);
      return { success: true, statement };
    } catch (error) {
      console.error(`❌ Error executing statement ${index + 1}:`);
      console.error(`   ${statement.substring(0, 100)}...`);
      console.error(`   Error: ${error.message}`);
      return { success: false, error: error.message, statement };
    }
  }

  /**
   * Deploy the entire schema
   */
  async deploy() {
    console.log('🚀 Starting schema deployment...\n');
    
    const statements = this.readSchemaFile();
    const results = {
      successful: [],
      failed: [],
      warnings: []
    };

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n📋 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`);
      
      const result = await this.executeStatement(statement, i);
      
      if (result.success) {
        results.successful.push({ index: i + 1, statement });
      } else if (result.warning) {
        results.warnings.push({ index: i + 1, statement });
      } else {
        results.failed.push({ index: i + 1, statement, error: result.error });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.successful.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.warnings.length > 0) {
      console.log('\n⚠️  STATEMENTS REQUIRING MANUAL EXECUTION:');
      results.warnings.forEach(item => {
        console.log(`   ${item.index}. ${item.statement.substring(0, 100)}...`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ FAILED STATEMENTS:');
      results.failed.forEach(item => {
        console.log(`   ${item.index}. ${item.statement.substring(0, 100)}...`);
        console.log(`      Error: ${item.error}`);
      });
    }

    const success = results.failed.length === 0;
    console.log(`\n${success ? '🎉' : '💥'} Deployment ${success ? 'completed successfully' : 'completed with errors'}!`);
    
    return {
      success,
      results
    };
  }

  /**
   * Verify the schema deployment
   */
  async verify() {
    console.log('\n🔍 Verifying schema deployment...');
    
    const verifications = [
      {
        name: 'UUID extension',
        query: "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')",
        expected: true
      },
      {
        name: 'users table',
        query: "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')",
        expected: true
      },
      {
        name: 'events table', 
        query: "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public')",
        expected: true
      },
      {
        name: 'registrations table',
        query: "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'registrations' AND table_schema = 'public')",
        expected: true
      },
      {
        name: 'payments table',
        query: "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public')",
        expected: true
      },
      {
        name: 'RLS enabled on users',
        query: "SELECT row_security FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public'",
        expected: true
      },
      {
        name: 'update_updated_at_column function',
        query: "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column')",
        expected: true
      }
    ];

    let allPassed = true;

    for (const verification of verifications) {
      try {
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: `SELECT (${verification.query}) as result`
        });

        if (error) throw error;

        const result = data && data[0] && data[0].result;
        const passed = result === verification.expected;
        
        console.log(`${passed ? '✅' : '❌'} ${verification.name}: ${result}`);
        
        if (!passed) allPassed = false;
      } catch (error) {
        console.log(`❌ ${verification.name}: Error - ${error.message}`);
        allPassed = false;
      }
    }

    console.log(`\n${allPassed ? '🎉' : '💥'} Schema verification ${allPassed ? 'passed' : 'failed'}!`);
    return allPassed;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';

  const deployer = new SchemaDeployer();

  switch (command) {
    case 'deploy':
      await deployer.deploy();
      break;
    
    case 'verify':
      await deployer.verify();
      break;
      
    case 'deploy-and-verify':
      const deployment = await deployer.deploy();
      if (deployment.success) {
        await deployer.verify();
      }
      break;
      
    default:
      console.log('Usage: node deploy-schema.js [deploy|verify|deploy-and-verify]');
      break;
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

main().catch(console.error);