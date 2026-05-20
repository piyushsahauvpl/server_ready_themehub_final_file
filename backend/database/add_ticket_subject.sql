-- Add subject column to tickets table if it doesn't exist
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NULL AFTER ticket_number;

-- Update category enum to include TECHNICAL_ISSUE and GENERAL_INQUIRY
ALTER TABLE tickets MODIFY COLUMN category ENUM('PRODUCT_ISSUE','ORDER_ISSUE','PAYMENT_ISSUE','ACCOUNT_ISSUE','TECHNICAL_ISSUE','GENERAL_INQUIRY') NOT NULL;

-- Update priority enum to include URGENT
ALTER TABLE tickets MODIFY COLUMN priority ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM';
