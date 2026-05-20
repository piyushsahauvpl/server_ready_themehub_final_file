-- Fix orders table to allow NULL product_id for testing
-- This allows orders to be created even if the product doesn't exist in the products table

-- Check if product_id column allows NULL (it should already, but let's make sure)
ALTER TABLE orders MODIFY COLUMN product_id INT NULL;

-- The foreign key constraint already allows NULL due to ON DELETE SET NULL
-- So orders can be created with product_id = NULL for testing purposes
