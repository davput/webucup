-- ============================================
-- COMPLETE DATABASE SETUP QUERY
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Set timezone ke WIB (Waktu Indonesia Barat / UTC+7)
SET timezone = 'Asia/Jakarta';

-- ============================================
-- 1. CREATE ACTIVITY LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  description TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================
-- 2. ADD MISSING DELIVERY COLUMNS
-- ============================================

-- Add columns to delivery_orders table
ALTER TABLE delivery_orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);

-- Add columns to deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN delivery_orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON COLUMN delivery_orders.recipient_name IS 'Name of person who received the order';
COMMENT ON COLUMN deliveries.started_at IS 'Timestamp when delivery started';
COMMENT ON COLUMN deliveries.completed_at IS 'Timestamp when delivery completed';
COMMENT ON COLUMN deliveries.cancelled_at IS 'Timestamp when delivery was cancelled';

-- ============================================
-- 3. CREATE SETTINGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE settings IS 'Application settings and configurations';

-- Create index
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
('company_name', 'Toko Pupuk', 'general', 'Nama perusahaan'),
('company_address', '', 'general', 'Alamat perusahaan'),
('company_phone', '', 'general', 'Nomor telepon perusahaan'),
('company_email', '', 'general', 'Email perusahaan'),
('tax_rate', '0', 'finance', 'Persentase pajak (%)'),
('currency', 'IDR', 'finance', 'Mata uang'),
('low_stock_threshold', '10', 'inventory', 'Batas stok rendah'),
('enable_notifications', 'true', 'system', 'Aktifkan notifikasi'),
('theme', 'light', 'system', 'Tema aplikasi (light/dark)')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow select activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow delete activity logs" ON activity_logs;

-- Policy untuk insert (semua user bisa log)
CREATE POLICY "Allow insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk select (semua user bisa baca)
CREATE POLICY "Allow select activity logs" ON activity_logs
  FOR SELECT
  USING (true);

-- Policy untuk delete (semua user bisa hapus)
CREATE POLICY "Allow delete activity logs" ON activity_logs
  FOR DELETE
  USING (true);

-- Enable RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;

-- Policy untuk settings
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. INSERT SAMPLE ACTIVITY LOGS (Optional)
-- ============================================

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

-- ============================================
-- 6. SECURITY & ACCOUNT SETTINGS
-- ============================================

-- Insert PIN setting (if not exists)
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_pin', NULL, 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert Password setting (if not exists)
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_password', NULL, 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Owner Name
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('owner_name', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Owner Email
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('owner_email', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Owner Phone
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('owner_phone', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Name
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_name', 'Distribusi Pupuk', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Address
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_address', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Phone
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_phone', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Email
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_email', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Tax ID (NPWP)
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_tax_id', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Business Description
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('business_description', 'Distributor pupuk berkualitas untuk pertanian Indonesia', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- App Logo
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_logo', '', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Primary Color
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('primary_color', '#10b981', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Accent Color
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('accent_color', '#3b82f6', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Sidebar Color
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('sidebar_color', '#ffffff', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Header Color
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('header_color', '#ffffff', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- App Name
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_name', 'Pupuk App', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- App Tagline
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_tagline', 'Distribusi', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Dashboard Widgets Configuration
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('dashboard_widgets', '[{"id":"stats","name":"Statistik Utama","enabled":true,"icon":"📊"},{"id":"sales-chart","name":"Grafik Penjualan","enabled":true,"icon":"📈"},{"id":"low-stock","name":"Stok Menipis","enabled":true,"icon":"⚠️"},{"id":"top-products","name":"Produk Terlaris","enabled":true,"icon":"🏆"},{"id":"recent-orders","name":"Order Terbaru","enabled":false,"icon":"🛒"},{"id":"recent-deliveries","name":"Pengiriman Terbaru","enabled":false,"icon":"🚚"}]', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 7. VERIFY SETUP
-- ============================================

-- Check activity_logs table
SELECT 
  'activity_logs' as table_name,
  COUNT(*) as row_count
FROM activity_logs;

-- Check system_settings table
SELECT 
  'system_settings' as table_name,
  COUNT(*) as row_count
FROM system_settings;

-- Check security and account settings
SELECT 
  setting_key,
  CASE 
    WHEN setting_key IN ('app_pin', 'app_password') THEN 
      CASE WHEN setting_value IS NULL THEN 'Not Set' ELSE '***SET***' END
    ELSE setting_value
  END as setting_value,
  setting_type
FROM system_settings
WHERE setting_key IN (
  'app_pin', 'app_password',
  'owner_name', 'owner_email', 'owner_phone',
  'business_name', 'business_address', 'business_phone',
  'business_email', 'business_tax_id', 'business_description'
)
ORDER BY setting_key;

-- Check delivery columns
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
  AND column_name IN ('started_at', 'completed_at', 'cancelled_at');

SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_orders' 
  AND column_name IN ('delivered_at', 'recipient_name');

-- Show recent activity logs
SELECT 
  user_name,
  action,
  entity_type,
  entity_name,
  description,
  created_at AT TIME ZONE 'Asia/Jakarta' as created_at_wib
FROM activity_logs
ORDER BY created_at DESC
LIMIT 10;

-- Show current timezone
SHOW timezone;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Jika semua query berhasil, Anda akan melihat:
-- 1. activity_logs table dengan sample data
-- 2. system_settings table dengan default settings
-- 3. Security settings (PIN & Password) ready to use
-- 4. Account settings (Owner & Business info) ready to configure
-- 5. delivery columns sudah ditambahkan
-- 6. Timezone sudah di-set ke Asia/Jakarta (WIB)
-- ============================================
-- NEXT STEPS:
-- 1. Buka aplikasi dan masuk ke Settings > User & Keamanan
-- 2. Setup PIN atau Password untuk keamanan aplikasi
-- 3. Isi data akun owner dan informasi bisnis
-- ============================================
