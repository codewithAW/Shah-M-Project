# Security & Assessment Integrity Architecture

This document outlines the security controls, data integrity mechanisms, and anti-cheating measures implemented in the Shah Muhammed Sab Website.

## 1. Authentication & Authorization (Supabase)
- **Role-Based Access Control (RBAC)**: All sensitive routes and API endpoints verify the user's role (`teacher` vs `student`) using server-side decoding of the Supabase JWT.
- **Row Level Security (RLS)**: Database tables are secured via RLS.
  - Students can only view their own attempts, assignments, and grades.
  - Students *cannot* view the `is_correct` field for quiz options.
  - Teachers can only view and manage data related to courses they own.
- **IDOR Protection**: The backend API endpoints strictly rely on `req.user.id` to identify the current user, rather than blindly trusting IDs provided in the request payload.

## 2. Server-Side Assessment Grading
- **No Client-Side Grading**: To prevent browser-level manipulation, the frontend *never* receives the correct answers during an active quiz.
- **Service Role Enforcement**: When a quiz is submitted to `/api/quiz/submit`, the Express server uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, fetch the true answer key, and calculate the grade safely out of reach of the student's browser.
- **Immutable Results**: Once a quiz attempt is finalized (`submitted`), students cannot modify their score or answers.

## 3. Quiz State & Duplicate Submission Prevention
- **One Active Attempt**: The system prevents students from taking the same quiz simultaneously in multiple tabs by enforcing a single `in_progress` attempt per student/quiz pair (via database index constraint).
- **Atomic Submission**: The backend verifies the attempt is `in_progress` before grading. If a user double-clicks the submit button or refreshes during grading, the database's locking mechanism and strict status check prevent duplicate score calculation.
- **Server-Side Timing**: Quiz expiration is calculated on the server using `started_at` + `duration_minutes`. Local JavaScript timers are used for UI purposes only and cannot be hacked to extend time.

## 4. Exam Integrity Mode (Browser Deterrence)
Teachers can enable an optional "Exam Integrity Mode" per quiz.
> **Disclaimer**: Browser-level controls provide a psychological deterrent and basic detection but cannot fully prevent cheating (e.g., using a phone to take a picture of the screen).

When enabled, the frontend implements:
- **Visibility Tracking**: Detects when the student switches tabs or minimizes the window.
- **Fullscreen Enforcement**: Requests fullscreen and logs if the user exits it.
- **Copy/Paste Prevention**: Blocks `onCopy` and `onPaste` events inside the quiz container.
- **Integrity Event Logging**: Violations (`TAB_SWITCH`, `FULLSCREEN_EXIT`, `COPY_ATTEMPT`) are securely sent to the server and logged in the `quiz_integrity_events` table for teacher review.

## 5. API Rate Limiting & Protection
The Express backend utilizes `helmet` for strict HTTP security headers and `express-rate-limit` to prevent abuse:
- **AI Quiz Generation**: Max 20 requests per 15 minutes.
- **Quiz Submission**: Max 10 requests per minute (to prevent DoS or brute-forcing).
- **Drive Uploads**: Max 50 requests per hour.

## 6. Privacy
- **Minimal Logging**: The `quiz_integrity_events` table only logs specific technical events (e.g., Tab switch) and timestamps.
- **No Intrusive Monitoring**: The platform does *not* capture webcam video, microphone audio, screen recordings, or GPS location. Students are explicitly notified when a quiz is in Exam Integrity Mode.
