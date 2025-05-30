import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      console.log('Please check that:');
      console.log('1. SUPABASE_URL is correct');
      console.log('2. SUPABASE_SERVICE_ROLE_KEY is correct');
      console.log('3. Database tables exist in Supabase');
    } else {
      console.log('✓ Supabase connection successful');
      
      // Test if tables exist
      const { data: tables, error: tableError } = await supabase
        .rpc('get_table_names');
        
      if (tableError) {
        console.log('Tables may not exist. Please run the schema SQL in Supabase SQL Editor');
      } else {
        console.log('✓ Database tables accessible');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testConnection();