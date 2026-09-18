-- ====================================================================
-- PHASE 7: ANALYTICS, PROGRESS TRACKING, & NOTIFICATIONS
-- Migration File: 00007_analytics_and_notifications.sql
-- ====================================================================

-- 1. Lecture Progress
CREATE TABLE IF NOT EXISTS lecture_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_student ON lecture_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture ON lecture_progress(lecture_id);

-- 2. Student Activity (Lightweight Educational Event Log)
CREATE TABLE IF NOT EXISTS student_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- e.g., 'lecture_completed', 'quiz_passed', 'assignment_submitted'
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES lectures(id) ON DELETE SET NULL,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_activity_student ON student_activity(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_created_at ON student_activity(created_at);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'ASSIGNMENT_PUBLISHED', 'QUIZ_RESULT', 'SYSTEM'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 4. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    assignment_notifications BOOLEAN NOT NULL DEFAULT true,
    quiz_notifications BOOLEAN NOT NULL DEFAULT true,
    grade_notifications BOOLEAN NOT NULL DEFAULT true,
    course_notifications BOOLEAN NOT NULL DEFAULT true,
    system_notifications BOOLEAN NOT NULL DEFAULT true, -- Admin overrides this if critical
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE lecture_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- lecture_progress policies
CREATE POLICY "Students can view own progress"
ON lecture_progress FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own progress"
ON lecture_progress FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
ON lecture_progress FOR UPDATE TO authenticated
USING (student_id = auth.uid());

-- Teachers can view progress for students enrolled in their courses
CREATE POLICY "Teachers can view progress for their courses"
ON lecture_progress FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM lectures l
        JOIN courses c ON l.course_id = c.id
        WHERE l.id = lecture_progress.lecture_id 
        AND c.teacher_id = auth.uid()
    )
);

-- student_activity policies
CREATE POLICY "Students can view own activity"
ON student_activity FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own activity"
ON student_activity FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- Teachers can view activity for their courses
CREATE POLICY "Teachers can view activity for their courses"
ON student_activity FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = student_activity.course_id 
        AND c.teacher_id = auth.uid()
    )
);

-- notifications policies
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Teachers can insert notifications (e.g. publishing assignment)
-- (Note: some system notifications will bypass RLS by using Service Role in backend)
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (true); -- Usually restricted to specific functions or Service Role, but allowed for simplicity in this phase

-- notification_preferences policies
CREATE POLICY "Users can manage own preferences"
ON notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lecture_progress_modtime
BEFORE UPDATE ON lecture_progress
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_preferences_modtime
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
