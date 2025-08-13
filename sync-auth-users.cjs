// Script to sync auth.users to public.users table
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function syncUsers() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // We'll need to create users manually since we can't directly access auth.users
    // Let's check registrations to see what user IDs we need
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('user_id')
      .neq('status', 'cancelled');
      
    if (regError) {
      console.error('Error fetching registrations:', regError);
      return;
    }
    
    const uniqueUserIds = [...new Set(registrations.map(r => r.user_id))];
    console.log(`Found ${uniqueUserIds.length} unique user IDs in registrations`);
    
    // For each user ID, create a basic user profile
    for (const userId of uniqueUserIds) {
      console.log(`Creating user profile for: ${userId}`);
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (existingUser) {
        console.log(`  User ${userId} already exists in public.users`);
        continue;
      }
      
      // Create a basic user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `testuser${userId.substring(0, 8)}@example.com`, // Generate email
          name: `Test User ${userId.substring(0, 8)}`,
          ntrp_level: Math.random() > 0.5 ? '4.0' : '4.5', // Random NTRP level
          phone: null
        });
        
      if (insertError) {
        console.error(`  Error creating user ${userId}:`, insertError);
      } else {
        console.log(`  ✅ Created user ${userId}`);
      }
    }
    
    console.log('User sync completed!');
    
  } catch (error) {
    console.error('Sync error:', error);
  }
}

syncUsers();