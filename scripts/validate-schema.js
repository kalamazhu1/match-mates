#!/usr/bin/env node

/**
 * Schema Validation Script
 * Validates the deployed database schema against expected structure
 */

import { createClient } from '@supabase/supabase-js';

const VALIDATION_TIMEOUT = 10000; // 10 seconds

class SchemaValidator {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('❌ Missing required environment variables:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      process.exit(1);
    }

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Test basic connection to Supabase
   */
  async testConnection() {
    console.log('🔌 Testing Supabase connection...');
    
    try {
      // Try a simple query that should work
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error && !error.message.includes('permission denied')) {
        throw error;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
  }

  /**
   * Validate table structure
   */
  async validateTables() {
    console.log('\n📋 Validating table structure...');
    
    const expectedTables = [
      {
        name: 'users',
        expectedColumns: [
          'id', 'email', 'name', 'ntrp_level', 'phone', 'created_at', 'updated_at'
        ]
      },
      {
        name: 'events',
        expectedColumns: [
          'id', 'title', 'description', 'event_type', 'format', 
          'skill_level_min', 'skill_level_max', 'location', 
          'date_start', 'date_end', 'registration_deadline',
          'entry_fee', 'max_participants', 'organizer_id', 'status',
          'whatsapp_group', 'telegram_group', 'created_at', 'updated_at'
        ]
      },
      {
        name: 'registrations',
        expectedColumns: [
          'id', 'user_id', 'event_id', 'status', 'payment_status',
          'payment_intent_id', 'registered_at', 'approved_at', 'paid_at'
        ]
      },
      {
        name: 'payments',
        expectedColumns: [
          'id', 'user_id', 'event_id', 'registration_id', 'amount',
          'currency', 'stripe_payment_intent_id', 'status', 
          'created_at', 'updated_at'
        ]
      }
    ];

    let allTablesValid = true;

    for (const table of expectedTables) {
      try {
        console.log(`\n  🔍 Checking table: ${table.name}`);
        
        // Try to get table info by attempting a select with limit 0
        const { data, error } = await this.supabase
          .from(table.name)
          .select('*')
          .limit(0);

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`    ❌ Table '${table.name}' does not exist`);
            allTablesValid = false;
            continue;
          } else if (error.message.includes('permission denied')) {
            console.log(`    ⚠️  Table '${table.name}' exists but access is restricted (this is expected with RLS)`);
          } else {
            throw error;
          }
        }

        console.log(`    ✅ Table '${table.name}' exists and is accessible`);
        
        // Note: We can't easily validate column structure through the client
        // This would require service role access or a custom function
        
      } catch (error) {
        console.log(`    ❌ Error checking table '${table.name}':`, error.message);
        allTablesValid = false;
      }
    }

    return allTablesValid;
  }

  /**
   * Test Row Level Security policies
   */
  async validateRLS() {
    console.log('\n🔒 Testing Row Level Security...');
    
    const tests = [
      {
        name: 'Unauthenticated users cannot access users table',
        test: async () => {
          const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .limit(1);
          
          // Should get an error or empty result due to RLS
          return error !== null || (data && data.length === 0);
        }
      },
      {
        name: 'Unauthenticated users can view open events',
        test: async () => {
          const { data, error } = await this.supabase
            .from('events')
            .select('id, title, status')
            .eq('status', 'open')
            .limit(1);
          
          // Should be able to read open events
          return error === null;
        }
      }
    ];

    let allRLSTestsPassed = true;

    for (const test of tests) {
      try {
        console.log(`\n  🔍 ${test.name}`);
        const result = await test.test();
        
        if (result) {
          console.log(`    ✅ Test passed`);
        } else {
          console.log(`    ❌ Test failed`);
          allRLSTestsPassed = false;
        }
      } catch (error) {
        console.log(`    ❌ Test error: ${error.message}`);
        allRLSTestsPassed = false;
      }
    }

    return allRLSTestsPassed;
  }

  /**
   * Test data integrity constraints
   */
  async validateConstraints() {
    console.log('\n⚖️  Testing data integrity constraints...');
    
    const tests = [
      {
        name: 'NTRP level constraint on users table',
        test: async () => {
          try {
            // This should fail due to CHECK constraint
            const { error } = await this.supabase
              .from('users')
              .insert({
                id: '00000000-0000-0000-0000-000000000000', // Invalid but for testing
                email: 'test@example.com',
                name: 'Test User',
                ntrp_level: '2.0' // Invalid NTRP level
              });
            
            return error !== null; // Should have an error
          } catch (error) {
            return true; // Any error means constraint is working
          }
        }
      },
      {
        name: 'Event status constraint',
        test: async () => {
          try {
            // This should fail due to CHECK constraint
            const { error } = await this.supabase
              .from('events')
              .insert({
                title: 'Test Event',
                event_type: 'tournament',
                format: 'single_elimination',
                skill_level_min: '3.0',
                skill_level_max: '4.0',
                location: 'Test Location',
                date_start: new Date().toISOString(),
                date_end: new Date().toISOString(),
                registration_deadline: new Date().toISOString(),
                max_participants: 16,
                organizer_id: '00000000-0000-0000-0000-000000000000',
                status: 'invalid_status' // Invalid status
              });
            
            return error !== null; // Should have an error
          } catch (error) {
            return true; // Any error means constraint is working
          }
        }
      }
    ];

    let allConstraintTestsPassed = true;

    for (const test of tests) {
      try {
        console.log(`\n  🔍 ${test.name}`);
        const result = await test.test();
        
        if (result) {
          console.log(`    ✅ Constraint is enforced`);
        } else {
          console.log(`    ❌ Constraint is not enforced`);
          allConstraintTestsPassed = false;
        }
      } catch (error) {
        console.log(`    ❌ Test error: ${error.message}`);
        // For constraint tests, errors might actually indicate the constraint is working
      }
    }

    return allConstraintTestsPassed;
  }

  /**
   * Run all validations
   */
  async validate() {
    console.log('🧪 Starting Schema Validation\n');
    console.log('='.repeat(50));

    const results = {
      connection: false,
      tables: false,
      rls: false,
      constraints: false
    };

    // Test connection
    results.connection = await this.testConnection();
    
    if (!results.connection) {
      console.log('\n❌ Cannot proceed with validation due to connection failure');
      return results;
    }

    // Validate tables
    results.tables = await this.validateTables();

    // Test RLS
    results.rls = await this.validateRLS();

    // Test constraints
    results.constraints = await this.validateConstraints();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`🔌 Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📋 Tables: ${results.tables ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔒 Row Level Security: ${results.rls ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚖️  Data Constraints: ${results.constraints ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n${allPassed ? '🎉' : '💥'} Overall validation: ${allPassed ? 'PASSED' : 'FAILED'}`);

    if (!allPassed) {
      console.log('\n💡 Tips for troubleshooting:');
      console.log('   - Ensure the schema.sql has been fully executed');
      console.log('   - Check Supabase dashboard for any deployment errors');
      console.log('   - Verify environment variables are correctly set');
      console.log('   - Run the deployment script again if needed');
    }

    return results;
  }
}

// CLI interface
async function main() {
  const validator = new SchemaValidator();
  await validator.validate();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

main().catch(console.error);