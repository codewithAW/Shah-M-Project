-- Add roll_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number text;

-- Add url fields to assignment_submissions
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS live_url text;
