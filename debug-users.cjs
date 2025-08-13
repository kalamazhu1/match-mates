// Debug script to check user data
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function debugUsers() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // First, check if we can query users table directly
  console.log('Testing direct users query...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(3);
    
  if (usersError) {
    console.error('Users query error:', usersError);
  } else {
    console.log('Found users:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('First user:', users[0]);
    }
  }
  
  // Check specific user ID from registration
  const testUserId = '646ecadf-e5eb-4f6b-b909-6c34cd7e5b65';
  console.log(`\nTesting specific user ID: ${testUserId}`);
  
  const { data: specificUser, error: specificError } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUserId)
    .single();
    
  if (specificError) {
    console.error('Specific user error:', specificError);
  } else {
    console.log('Specific user found:', specificUser);
  }
  
  // Test the join query directly
  console.log('\nTesting join query...');
  const { data: joinTest, error: joinError } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      status,
      user:users!user_id(name, email, ntrp_level)
    `)
    .eq('event_id', '07b63d59-1314-4b84-bab6-8e99666b46aa')
    .limit(3);
    
  if (joinError) {
    console.error('Join query error:', joinError);
  } else {
    console.log('Join results:', joinTest);
  }
}

debugUsers();