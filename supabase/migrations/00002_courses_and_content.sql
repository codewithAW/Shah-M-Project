-- 00002_courses_and_content.sql

-- ENUMS
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE video_type AS ENUM ('youtube', 'google_drive', 'external', 'none');
CREATE TYPE resource_type AS ENUM ('pdf', 'document', 'image', 'video', 'link', 'other');
CREATE TYPE storage_provider AS ENUM ('google_drive', 'external', 'none');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');

-- TABLES

-- 1. Course Categories
CREATE TABLE public.course_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Courses
CREATE TABLE public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  thumbnail_url text,
  category_id uuid REFERENCES public.course_categories ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status course_status DEFAULT 'draft'::course_status NOT NULL,
  difficulty difficulty_level DEFAULT 'beginner'::difficulty_level NOT NULL,
  estimated_duration text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at timestamp with time zone
);

-- 3. Lectures
CREATE TABLE public.lectures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text,
  description text,
  content text,
  video_type video_type DEFAULT 'none'::video_type NOT NULL,
  video_url text,
  thumbnail_url text,
  lecture_order integer NOT NULL,
  duration text,
  status course_status DEFAULT 'draft'::course_status NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at timestamp with time zone,
  UNIQUE(course_id, lecture_order)
);

-- 4. Resources
CREATE TABLE public.resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses ON DELETE CASCADE NOT NULL,
  lecture_id uuid REFERENCES public.lectures ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  resource_type resource_type DEFAULT 'other'::resource_type NOT NULL,
  file_name text,
  file_url text,
  external_url text,
  storage_provider storage_provider DEFAULT 'none'::storage_provider NOT NULL,
  mime_type text,
  file_size bigint,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enrollments
CREATE TABLE public.enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'active'::enrollment_status NOT NULL,
  enrolled_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, course_id)
);

-- INDEXES
CREATE INDEX idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX idx_courses_category_id ON public.courses(category_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_slug ON public.courses(slug);

CREATE INDEX idx_lectures_course_id ON public.lectures(course_id);
CREATE INDEX idx_lectures_status ON public.lectures(status);

CREATE INDEX idx_resources_course_id ON public.resources(course_id);
CREATE INDEX idx_resources_lecture_id ON public.resources(lecture_id);

CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);


-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 1. Course Categories Policies
-- Everyone can view categories
CREATE POLICY "Categories are viewable by everyone" ON public.course_categories
  FOR SELECT USING (true);

-- Only teachers can insert/update/delete (in real app maybe just admins, but teacher is fine for now)
CREATE POLICY "Teachers can manage categories" ON public.course_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- 2. Courses Policies
-- Anyone can view published courses
CREATE POLICY "Published courses are viewable by everyone" ON public.courses
  FOR SELECT USING (status = 'published');

-- Teachers can view all their own courses (including drafts)
CREATE POLICY "Teachers can view own courses" ON public.courses
  FOR SELECT USING (auth.uid() = teacher_id);

-- Teachers can insert courses
CREATE POLICY "Teachers can insert courses" ON public.courses
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Teachers can update their own courses
CREATE POLICY "Teachers can update own courses" ON public.courses
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Teachers can delete their own courses
CREATE POLICY "Teachers can delete own courses" ON public.courses
  FOR DELETE USING (auth.uid() = teacher_id);

-- 3. Lectures Policies
-- Anyone can view lectures of published courses
CREATE POLICY "Lectures of published courses viewable by everyone" ON public.lectures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published')
  );

-- Teachers can view all lectures of their courses
CREATE POLICY "Teachers can view lectures of their courses" ON public.lectures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- Teachers can manage lectures of their own courses
CREATE POLICY "Teachers can insert lectures to own courses" ON public.lectures
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can update lectures of own courses" ON public.lectures
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can delete lectures of own courses" ON public.lectures
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- 4. Resources Policies
-- Anyone can view resources of published courses
CREATE POLICY "Resources of published courses viewable by everyone" ON public.resources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published')
  );

-- Teachers can view all resources of their courses
CREATE POLICY "Teachers can view resources of their courses" ON public.resources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- Teachers can manage resources of their own courses
CREATE POLICY "Teachers can manage resources of own courses" ON public.resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- 5. Enrollments Policies
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = student_id);

-- Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses" ON public.enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- Students can insert their own enrollments
CREATE POLICY "Students can enroll themselves" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Teachers can manage enrollments for their courses
CREATE POLICY "Teachers can manage enrollments for their courses" ON public.enrollments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );
CREATE POLICY "Teachers can delete enrollments for their courses" ON public.enrollments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

-- Insert dummy category for ease of development
INSERT INTO public.course_categories (name, description, slug) VALUES 
('Mathematics', 'Calculus, Algebra, and beyond', 'mathematics'),
('Physics', 'Classical and modern physics', 'physics'),
('Computer Science', 'Programming, algorithms, and systems', 'computer-science');
