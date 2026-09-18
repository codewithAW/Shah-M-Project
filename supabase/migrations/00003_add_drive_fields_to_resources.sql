-- 00003_add_drive_fields_to_resources.sql

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS drive_file_id text,
ADD COLUMN IF NOT EXISTS drive_folder_id text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS web_view_url text,
ADD COLUMN IF NOT EXISTS download_url text;

-- Add comments
COMMENT ON COLUMN public.resources.drive_file_id IS 'Google Drive File ID';
COMMENT ON COLUMN public.resources.web_view_url IS 'URL to view the file in Google Drive';
