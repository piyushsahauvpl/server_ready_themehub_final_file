-- Update orders table to add billing_address and payment_method
-- Run this SQL in phpMyAdmin or MySQL command line

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billing_address TEXT DEFAULT NULL AFTER status,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card' AFTER billing_address;
