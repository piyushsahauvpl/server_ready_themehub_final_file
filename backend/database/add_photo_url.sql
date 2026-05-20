-- Add photo_url column to users table
-- Run this SQL in phpMyAdmin or MySQL command line

-- Check if column exists first (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- If you get an error that column already exists, that's fine - it means it's already there

ALTER TABLE users 
ADD COLUMN photo_url VARCHAR(500) DEFAULT NULL AFTER phone;
