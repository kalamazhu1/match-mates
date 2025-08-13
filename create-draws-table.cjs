const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDrawsTable() {
  try {
    const sql = fs.readFileSync('./draws_table_schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement.trim() + ';' 
      });
      
      if (error) {
        console.error('SQL execution error:', error);
        console.error('Statement:', statement.trim());
      } else {
        console.log('Executed statement successfully');
      }
    }
    
    console.log('Draws table creation completed!');
  } catch (err) {
    console.error('Error:', err);
  }
}

createDrawsTable();