-- Add root_admin to user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'root_admin';

-- Update profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS roll_number text UNIQUE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id),
  rejection_reason text
);

-- Enable RLS for reset requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Reset requests policies
CREATE POLICY "Students can insert their own reset request"
ON public.password_reset_requests FOR INSERT
WITH CHECK (
  auth.uid() = student_id 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
);

CREATE POLICY "Students can view their own reset requests"
ON public.password_reset_requests FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all reset requests"
ON public.password_reset_requests FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can update reset requests"
ON public.password_reset_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Fix Profiles trigger for custom metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, username, roll_number)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'roll_number'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS tightening
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers view all profiles" ON public.profiles
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Root admins view all profiles" ON public.profiles
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'root_admin'));
