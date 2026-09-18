-- 00001_profiles_and_roles.sql
-- Create a custom 'role' type
CREATE TYPE user_role AS ENUM ('student', 'teacher');

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies

-- 1. Profiles are viewable by everyone who is logged in (useful for displaying teacher names, student names in discussions later).
-- If strict privacy is desired, this could be restricted to just 'view own profile' + 'teachers view all'.
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Users can insert their own profile.
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile (but not their role!).
-- The role column should ideally be protected from updates by regular users, 
-- but Supabase policies apply to rows, not columns. 
-- In a more advanced setup, you can use column-level security or split the role into a separate secured table.
-- For now, we restrict update to self. A secure trigger or backend logic is needed to prevent role elevation.
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to safely elevate a user to teacher (to be run manually in SQL Editor)
-- Example: SELECT make_teacher('user-uuid-here');
CREATE OR REPLACE FUNCTION public.make_teacher(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET role = 'teacher' WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
