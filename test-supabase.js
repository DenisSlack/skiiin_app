const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testUpdateProfile() {
  console.log('Testing Supabase profile update...');
  
  try {
    // First, get a user to test with
    const { data: users, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (getUserError) {
      console.error('Error getting users:', getUserError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const user = users[0];
    console.log('Found user:', user.id);
    
    // Try to update the profile
    const updateData = {
      gender: 'male',
      age: 25,
      skin_type: 'oily',
      skin_concerns: ['acne'],
      allergies: [],
      preferences: ['organic'],
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Updating with data:', updateData);
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Update error:', error);
    } else {
      console.log('Update successful:', data);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUpdateProfile();