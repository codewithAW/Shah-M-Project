import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzvnqbrhjtpzsgbrqxny.supabase.co';
const supabaseKey = 'sb_publishable_68OtBcYyb1ZcWlj-QUKAnw_Tyn0ogaQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: courses } = await supabase.from('courses').select('id, title, teacher_id');
  console.log('Courses:', JSON.stringify(courses));
  
  const { data: enrollments } = await supabase.from('enrollments').select('*');
  console.log('Enrollments:', JSON.stringify(enrollments));
  
  const { data: profiles } = await supabase.from('profiles').select('id, role, full_name, status');
  console.log('Profiles:', JSON.stringify(profiles));
}
check();
