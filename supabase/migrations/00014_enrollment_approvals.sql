-- 00014_enrollment_approvals.sql
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'pending';
