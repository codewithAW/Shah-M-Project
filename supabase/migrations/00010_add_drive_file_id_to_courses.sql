-- Add drive_file_id column to courses to store Google Drive IDs for course thumbnails
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_file_id text;
