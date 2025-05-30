import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    // Генерируем уникальный ID для пользователя
    const userId = crypto.randomUUID();
    
    // Хешируем пароль (в реальном приложении используйте более безопасные методы)
    const hashedPassword = crypto.createHash('sha256').update('admin1234').digest('hex');
    
    const userData = {
      id: userId,
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      profile_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating admin user:', error);
    } else {
      console.log('Admin user created successfully:', data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser(); 