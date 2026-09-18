-- 00004_assignments.sql

-- ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    lecture_id uuid REFERENCES public.lectures(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    instructions text,
    due_date timestamp with time zone,
    max_marks integer NOT NULL DEFAULT 100,
    status text NOT NULL CHECK (status IN ('draft', 'published', 'closed', 'archived')) DEFAULT 'draft',
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at timestamp with time zone
);

CREATE INDEX idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

-- ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text text,
    drive_file_id text,
    file_name text,
    file_url text,
    status text NOT NULL CHECK (status IN ('draft', 'submitted', 'late', 'under_review', 'graded', 'returned')) DEFAULT 'draft',
    submitted_at timestamp with time zone,
    graded_at timestamp with time zone,
    marks integer CHECK (marks >= 0),
    feedback text,
    graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON public.assignment_submissions(student_id);


-- RLS for ASSIGNMENTS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage assignments for their courses
CREATE POLICY "Teachers can view assignments in their courses"
    ON public.assignments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND teacher_id = auth.uid()));

CREATE POLICY "Teachers can insert assignments to their courses"
    ON public.assignments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()));

CREATE POLICY "Teachers can update assignments in their courses"
    ON public.assignments FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND teacher_id = auth.uid()));

CREATE POLICY "Teachers can delete assignments in their courses"
    ON public.assignments FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.courses WHERE id = assignments.course_id AND teacher_id = auth.uid()));

-- Students can view published assignments for enrolled courses
CREATE POLICY "Students can view published assignments for enrolled courses"
    ON public.assignments FOR SELECT
    USING (
        status = 'published' AND
        EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE course_id = assignments.course_id 
            AND student_id = auth.uid() 
            AND status = 'active'
        )
    );

-- RLS for ASSIGNMENT SUBMISSIONS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Students can insert/update their own submissions
CREATE POLICY "Students can insert own submissions"
    ON public.assignment_submissions FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions"
    ON public.assignment_submissions FOR UPDATE
    USING (student_id = auth.uid());

CREATE POLICY "Students can view own submissions"
    ON public.assignment_submissions FOR SELECT
    USING (student_id = auth.uid());

-- Teachers can view and update (grade) submissions for their courses
CREATE POLICY "Teachers can view submissions for their courses"
    ON public.assignment_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON a.course_id = c.id
            WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can update submissions for their courses"
    ON public.assignment_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON a.course_id = c.id
            WHERE a.id = assignment_submissions.assignment_id AND c.teacher_id = auth.uid()
        )
    );
