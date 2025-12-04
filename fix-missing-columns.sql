-- Migration: Fix Missing Columns in Deliveries and Payments Tables
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Fix Deliveries Table - Add Missing Columns
-- ============================================

-- Add delivery_number column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'delivery_number'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN delivery_number VARCHAR(50) UNIQUE;
    COMMENT ON COLUMN deliveries.delivery_number IS 'Unique delivery number (e.g., DEL-123456)';
  END IF;
END $$;

-- Add truck_number column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'truck_number'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN truck_number VARCHAR(50);
    COMMENT ON COLUMN deliveries.truck_number IS 'Truck license plate number';
  END IF;
END $$;

-- Add total_orders column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'total_orders'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN total_orders INTEGER DEFAULT 0;
    COMMENT ON COLUMN deliveries.total_orders IS 'Total number of orders in this delivery';
  END IF;
END $$;

-- Add total_sacks column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'total_sacks'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN total_sacks INTEGER DEFAULT 0;
    COMMENT ON COLUMN deliveries.total_sacks IS 'Total number of sacks/karung in this delivery';
  END IF;
END $$;

-- Add route_notes column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'route_notes'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN route_notes TEXT;
    COMMENT ON COLUMN deliveries.route_notes IS 'Notes about delivery route or special instructions';
  END IF;
END $$;

-- ============================================
-- 2. Create delivery_orders Table if Not Exists
-- ============================================

-- Create delivery_orders junction table
CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sequence_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delivery_id, order_id)
);

COMMENT ON TABLE delivery_orders IS 'Junction table linking deliveries to orders';
COMMENT ON COLUMN delivery_orders.sequence_number IS 'Order sequence in delivery route';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_id ON delivery_orders(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_order_id ON delivery_orders(order_id);

-- ============================================
-- 3. Create delivery_workers Table if Not Exists
-- ============================================

-- Create delivery_workers junction table
CREATE TABLE IF NOT EXISTS delivery_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'helper',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delivery_id, employee_id)
);

COMMENT ON TABLE delivery_workers IS 'Junction table linking deliveries to workers/helpers';
COMMENT ON COLUMN delivery_workers.role IS 'Worker role: driver, helper, etc.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_workers_delivery_id ON delivery_workers(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_workers_employee_id ON delivery_workers(employee_id);

-- ============================================
-- 4. Verify Tables Structure
-- ============================================

-- Show current deliveries table structure
SELECT 
  'deliveries' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'deliveries'
ORDER BY ordinal_position;

-- Show delivery_orders table structure
SELECT 
  'delivery_orders' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'delivery_orders'
ORDER BY ordinal_position;

-- Show delivery_workers table structure
SELECT 
  'delivery_workers' as table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'delivery_workers'
ORDER BY ordinal_position;

-- ============================================
-- 5. Success Message
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📋 Tables created/updated:';
  RAISE NOTICE '   - deliveries (with all required columns)';
  RAISE NOTICE '   - delivery_orders (junction table)';
  RAISE NOTICE '   - delivery_workers (junction table)';
  RAISE NOTICE '🔍 Check the query results above to verify the structure';
END $$;
