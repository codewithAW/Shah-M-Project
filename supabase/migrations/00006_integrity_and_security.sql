-- ====================================================================
-- PHASE 6: ASSESSMENT SECURITY & ANTI-CHEATING
-- Migration File: 00006_integrity_and_security.sql
-- ====================================================================

-- 1. Add integrity mode toggle to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS is_integrity_mode_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;

-- 2. Create quiz_integrity_events table
CREATE TABLE IF NOT EXISTS quiz_integrity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_quiz_integrity_events_attempt ON quiz_integrity_events(attempt_id);

-- 3. Row Level Security (RLS) for Integrity Events
ALTER TABLE quiz_integrity_events ENABLE ROW LEVEL SECURITY;

-- Students can insert their own events for their own attempts
CREATE POLICY "Students can insert their own integrity events"
ON quiz_integrity_events FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM quiz_attempts
        WHERE id = attempt_id AND student_id = auth.uid()
    )
);

-- Students can view their own events (optional, for transparency if needed, but safe to allow)
CREATE POLICY "Students can view their own integrity events"
ON quiz_integrity_events FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Teachers can view integrity events for attempts on their quizzes
CREATE POLICY "Teachers can view integrity events for their quizzes"
ON quiz_integrity_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN courses c ON q.course_id = c.id
        WHERE qa.id = quiz_integrity_events.attempt_id 
        AND c.teacher_id = auth.uid()
    )
);

-- 4. Secure the attempts table
-- Add a constraint to ensure max_attempts is respected per student/quiz.
-- (PostgreSQL doesn't support complex cross-table constraints natively in a simple CHECK, 
-- but we can add a unique index to prevent duplicate in_progress attempts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_attempt_per_quiz 
ON quiz_attempts(student_id, quiz_id) 
WHERE status = 'in_progress';

-- Prevent multiple finalized attempts if max_attempts = 1
-- Note: A more complex trigger would be needed for dynamic max_attempts enforcement. 
-- For Phase 6, we rely strongly on the backend `requireStudent` logic to check `max_attempts` 
-- before creating a new attempt.

-- 5. Harden assignment_submissions table
-- Ensure a student can only have one submission per assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_submission_per_assignment 
ON assignment_submissions(student_id, assignment_id);

-- 6. Add status integrity to attempts
-- Attempt status can only be one of the known values
ALTER TABLE quiz_attempts
ADD CONSTRAINT valid_attempt_status 
CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'abandoned'));
