-- Add drive_file_id column to lectures to store Google Drive IDs for custom thumbnails
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS drive_file_id text;
