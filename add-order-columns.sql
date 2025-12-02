-- ============================================
-- QUICK FIX: Add Missing Columns to Orders Table
-- Run this if you get 406 or 400 errors when creating orders
-- ============================================

-- Add payment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

-- Add payment_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

-- Add due_date column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add notes column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing orders to have default payment values
UPDATE orders 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

UPDATE orders 
SET payment_status = 'unpaid' 
WHERE payment_status IS NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Success message
SELECT 'Columns added successfully! You can now create orders.' as message;
