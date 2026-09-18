-- 00013_student_approval.sql

-- Fix Profiles trigger for custom metadata to include status (for pending students)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, username, roll_number, status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'roll_number',
    COALESCE(new.raw_user_meta_data->>'status', 'active')
  );
  RETURN new;
END;
$$;
