import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedRootAdmin() {
  const email = 'codewithabdulwaheed@gmail.com';
  const password = '123kalim@';
  
  console.log("Checking if root admin exists...");
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  const existingUser = usersData.users.find(u => u.email === email);
  
  if (existingUser) {
    console.log("User already exists, ensuring root_admin role...");
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: { role: 'root_admin', full_name: 'Root Admin' }
    });
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'root_admin' })
      .eq('id', existingUser.id);
      
    if (updateError || profileError) {
      console.error("Error updating existing user:", updateError || profileError);
    } else {
      console.log("Existing user upgraded to root_admin.");
    }
  } else {
    console.log("Creating new root admin...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'root_admin',
        full_name: 'Root Admin'
      }
    });
    
    if (error) {
      console.error("Error creating root admin:", error);
    } else {
      console.log("Root admin created successfully with ID:", data.user.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'root_admin' })
        .eq('id', data.user.id);
        
      if (profileError) {
        console.error("Error updating profile role:", profileError);
      } else {
        console.log("Profile role updated to root_admin.");
      }
    }
  }
}

seedRootAdmin();
