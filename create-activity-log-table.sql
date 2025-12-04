-- Set timezone to WIB (UTC+7) for this session
SET timezone = 'Asia/Jakarta';

-- Create Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- order, product, store, delivery, payment, etc
  entity_id UUID,
  entity_name VARCHAR(255),
  description TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() -- TIMESTAMPTZ akan menyimpan dengan timezone
);

COMMENT ON TABLE activity_logs IS 'System activity audit log';
COMMENT ON COLUMN activity_logs.action IS 'Action performed: create, update, delete, view, export, etc';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional data in JSON format';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);

-- Insert sample data for testing
INSERT INTO activity_logs (user_name, action, entity_type, entity_name, description) VALUES
('Admin', 'create', 'order', 'ORD-20241204-0001', 'Membuat order baru untuk Toko Maju Jaya'),
('Admin', 'update', 'product', 'Urea 50kg', 'Mengubah harga produk dari Rp 250.000 ke Rp 260.000'),
('Admin', 'create', 'store', 'Toko Berkah', 'Menambahkan toko baru di Kecamatan Sukajadi'),
('Admin', 'delete', 'product', 'NPK 25kg', 'Menghapus produk yang sudah tidak dijual'),
('Admin', 'update', 'order', 'ORD-20241204-0001', 'Mengubah status order menjadi "Dikirim"'),
('Admin', 'create', 'delivery', 'DEL-20241204-0001', 'Membuat jadwal pengiriman untuk 5 order'),
('Admin', 'create', 'payment', 'PAY-20241204-0001', 'Mencatat pembayaran Rp 5.000.000'),
('Admin', 'update', 'store', 'Toko Maju Jaya', 'Mengubah alamat toko'),
('Admin', 'export', 'report', 'Laporan Penjualan', 'Export laporan penjualan bulan November'),
('Admin', 'view', 'dashboard', 'Dashboard', 'Melihat dashboard utama');

-- Verify table created
SELECT 
  action,
  entity_type,
  entity_name,
  description,
  created_at
FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;
