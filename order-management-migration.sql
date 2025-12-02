-- ============================================
-- MIGRATION: Order Management System
-- Description: Enhanced order management with delivery tracking
-- Date: December 2024
-- ============================================

-- Drop existing tables if needed (be careful in production!)
-- DROP TABLE IF EXISTS delivery_notes CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS delivery_orders CASCADE;
-- DROP TABLE IF EXISTS delivery_workers CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS deliveries CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;

-- ============================================
-- 1. UPDATE ORDERS TABLE
-- ============================================

-- Drop old orders table if exists
DROP TABLE IF EXISTS orders CASCADE;

-- Create new enhanced orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_delivery', -- pending_delivery, scheduled, on_delivery, delivered, cancelled
  payment_method VARCHAR(50) NOT NULL, -- cash, transfer, tempo
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
  due_date DATE, -- Untuk pembayaran tempo
  notes TEXT,
  order_date TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE ORDER ITEMS TABLE
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. UPDATE DELIVERIES TABLE
-- ============================================

-- Drop old deliveries table if exists
DROP TABLE IF EXISTS deliveries CASCADE;

-- Create new enhanced deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number VARCHAR(50) UNIQUE NOT NULL,
  delivery_date DATE NOT NULL,
  truck_number VARCHAR(50),
  driver_id UUID REFERENCES employees(id),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, on_delivery, delivered, cancelled
  total_orders INTEGER DEFAULT 0,
  total_sacks INTEGER DEFAULT 0,
  route_notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. CREATE DELIVERY ORDERS TABLE (NEW)
-- ============================================

CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  route_order INTEGER DEFAULT 0, -- Urutan pengiriman
  delivery_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, on_delivery, delivered
  delivered_at TIMESTAMP,
  proof_photo_url TEXT, -- URL foto bukti sampai
  signature_data TEXT, -- Data tanda tangan digital (base64)
  recipient_name VARCHAR(255), -- Nama penerima
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delivery_id, order_id)
);

-- ============================================
-- 5. CREATE DELIVERY WORKERS TABLE
-- ============================================

CREATE TABLE delivery_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  sacks_loaded INTEGER DEFAULT 0,
  wage_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. UPDATE PAYMENTS TABLE
-- ============================================

-- Drop old payments table if exists
DROP TABLE IF EXISTS payments CASCADE;

-- Create new enhanced payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL, -- cash, transfer
  proof_url TEXT, -- URL bukti transfer
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. CREATE DELIVERY NOTES TABLE (NEW)
-- ============================================

CREATE TABLE delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  note_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. CREATE INVOICES TABLE (NEW)
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid, overdue
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. CREATE INDEXES
-- ============================================

-- Orders indexes
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(order_date);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Deliveries indexes
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Delivery orders indexes
CREATE INDEX idx_delivery_orders_delivery ON delivery_orders(delivery_id);
CREATE INDEX idx_delivery_orders_order ON delivery_orders(order_id);

-- Delivery workers indexes
CREATE INDEX idx_delivery_workers_delivery ON delivery_workers(delivery_id);
CREATE INDEX idx_delivery_workers_employee ON delivery_workers(employee_id);

-- Payments indexes
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_store ON payments(store_id);

-- Invoices indexes
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Delivery notes indexes
CREATE INDEX idx_delivery_notes_delivery ON delivery_notes(delivery_id);

-- ============================================
-- 10. CREATE TRIGGERS
-- ============================================

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON orders 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for deliveries updated_at
CREATE TRIGGER update_deliveries_updated_at 
BEFORE UPDATE ON deliveries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for delivery_orders updated_at
CREATE TRIGGER update_delivery_orders_updated_at 
BEFORE UPDATE ON delivery_orders 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at 
BEFORE UPDATE ON invoices 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample order
-- INSERT INTO orders (order_number, store_id, total_amount, payment_method, notes, created_by)
-- SELECT 
--   'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
--   id,
--   1000000,
--   'cash',
--   'Sample order',
--   'Admin'
-- FROM stores LIMIT 1;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'orders', 
    'order_items', 
    'deliveries', 
    'delivery_orders', 
    'delivery_workers',
    'payments',
    'delivery_notes',
    'invoices'
  )
ORDER BY table_name;

-- Show indexes
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'orders', 
    'order_items', 
    'deliveries', 
    'delivery_orders', 
    'delivery_workers',
    'payments',
    'delivery_notes',
    'invoices'
  )
ORDER BY tablename, indexname;

COMMENT ON TABLE orders IS 'Enhanced orders table with payment tracking';
COMMENT ON TABLE deliveries IS 'Enhanced deliveries table with route management';
COMMENT ON TABLE delivery_orders IS 'Many-to-many relationship between deliveries and orders';
COMMENT ON TABLE invoices IS 'Auto-generated invoices for orders';
COMMENT ON TABLE delivery_notes IS 'Auto-generated delivery notes (surat jalan)';
