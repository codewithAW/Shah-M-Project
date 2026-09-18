import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test' + Date.now() + '@student.shahmuhammed.local',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      role: 'student',
      full_name: 'Test Student',
      username: 'teststudent' + Date.now(),
      roll_number: 'TEST' + Date.now()
    }
  });

  if (error) {
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error message:', error.message);
  } else {
    console.log('Success:', data.user.id);
    await supabase.auth.admin.deleteUser(data.user.id);
  }
}

test();
