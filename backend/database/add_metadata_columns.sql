-- Add metadata columns to products table
-- Run this SQL to add new metadata fields for theme templates

USE themehub_db;

-- Check and add columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_update DATE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS high_resolution TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_browsers VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_with VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS themeforest_files_included VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS documentation VARCHAR(255) DEFAULT 'Well Documented';
ALTER TABLE products ADD COLUMN IF NOT EXISTS layout VARCHAR(255) DEFAULT 'Responsive';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_latest TINYINT(1) DEFAULT 0;

-- Add indexes for performance
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_is_featured (is_featured);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_is_latest (is_latest);

-- Display completion message
SELECT 'Metadata columns added successfully!' as Status;
