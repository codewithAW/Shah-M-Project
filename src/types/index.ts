// Supabase Database Types for Phase 3

export type CourseStatus = 'draft' | 'published' | 'archived';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type VideoType = 'youtube' | 'google_drive' | 'external' | 'none';
export type ResourceType = 'pdf' | 'document' | 'image' | 'video' | 'link' | 'other';
export type StorageProvider = 'google_drive' | 'external' | 'none';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface CourseCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  teacher_id: string;
  status: CourseStatus;
  difficulty: DifficultyLevel;
  estimated_duration: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  external_link?: string | null;
  drive_file_id?: string | null;
}

export interface Lecture {
  id: string;
  course_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: string | null;
  video_type: VideoType;
  video_url: string | null;
  thumbnail_url: string | null;
  lecture_order: number;
  duration: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  drive_file_id?: string | null;
}

export interface Resource {
  id: string;
  course_id: string;
  lecture_id: string | null;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  file_name: string | null;
  file_url: string | null;
  external_url: string | null;
  storage_provider: StorageProvider;
  mime_type: string | null;
  file_size: number | null;
  drive_file_id?: string | null;
  drive_folder_id?: string | null;
  thumbnail_url?: string | null;
  web_view_url?: string | null;
  download_url?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

// Phase 5: Assignments
export interface Assignment {
  id: string;
  course_id: string;
  lecture_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_marks: number;
  status: 'draft' | 'published' | 'closed' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  drive_file_id: string | null;
  file_name: string | null;
  file_url: string | null;
  github_url: string | null;
  live_url: string | null;
  status: 'draft' | 'submitted' | 'late' | 'under_review' | 'graded' | 'returned';
  submitted_at: string | null;
  graded_at: string | null;
  marks: number | null;
  feedback: string | null;
  graded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Phase 5: Quizzes
export interface Quiz {
  id: string;
  course_id: string;
  lecture_id: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  duration_minutes: number | null;
  max_attempts: number;
  passing_percentage: number;
  status: 'draft' | 'published' | 'closed' | 'archived';
  is_integrity_mode_enabled?: boolean;
  available_from?: string | null;
  available_until?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'written';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  question_text: string;
  question_order: number;
  marks: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
  options?: QuizQuestionOption[]; // Joined data
}

export interface QuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  is_correct?: boolean; // Secure, omitted for students
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'graded' | 'cheating_detected';
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

// Phase 7: Progress & Analytics
export interface LectureProgress {
  id: string;
  student_id: string;
  lecture_id: string;
  completed: boolean;
  completed_at: string | null;
  last_viewed_at: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface StudentActivity {
  id: string;
  student_id: string;
  activity_type: string;
  course_id: string | null;
  lecture_id: string | null;
  assignment_id: string | null;
  quiz_id: string | null;
  metadata: any | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  course_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  assignment_notifications: boolean;
  quiz_notifications: boolean;
  grade_notifications: boolean;
  course_notifications: boolean;
  system_notifications: boolean;
  updated_at: string;
}
