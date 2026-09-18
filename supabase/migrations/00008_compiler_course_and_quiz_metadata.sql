-- Add ai_metadata column to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- Insert Compiler Construction course if it doesn't exist
DO $$
DECLARE
  v_category_id UUID;
  v_course_id UUID;
  v_teacher_id UUID;
BEGIN
  -- Check if Computer Science category exists, if not create it
  SELECT id INTO v_category_id FROM public.course_categories WHERE name = 'Computer Science' LIMIT 1;
  
  IF v_category_id IS NULL THEN
    INSERT INTO public.course_categories (name, description, icon, color)
    VALUES ('Computer Science', 'Courses related to computer science and software engineering.', 'Code', 'bg-blue-500/10 text-blue-500')
    RETURNING id INTO v_category_id;
  END IF;

  -- Insert Compiler Construction course
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Compiler Construction' LIMIT 1;
  
  SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'teacher' LIMIT 1;

  IF v_course_id IS NULL AND v_teacher_id IS NOT NULL THEN
    INSERT INTO public.courses (title, slug, description, short_description, category_id, teacher_id, difficulty, thumbnail_url, estimated_duration, status)
    VALUES (
      'Compiler Construction',
      'compiler-construction',
      'Learn the principles and techniques used in compiler design, including lexical analysis, syntax analysis, semantic analysis, code generation, and optimization.',
      'Master the art of building compilers.',
      v_category_id,
      v_teacher_id,
      'advanced'::difficulty_level,
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80',
      '40 hours',
      'published'::course_status
    );
  END IF;
END $$;
