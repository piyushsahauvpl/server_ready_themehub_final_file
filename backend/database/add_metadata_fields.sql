-- Add metadata fields to products table
-- Run this SQL file to add support for product metadata

ALTER TABLE products ADD COLUMN IF NOT EXISTS last_update DATE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS high_resolution TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_browsers VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compatible_with VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS themeforest_files_included VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS documentation VARCHAR(255) DEFAULT 'Well Documented';
ALTER TABLE products ADD COLUMN IF NOT EXISTS layout VARCHAR(100) DEFAULT 'Responsive';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_latest TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0;

-- Add indexes for better query performance
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_is_latest (is_latest);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_is_featured (is_featured);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_last_update (last_update);
