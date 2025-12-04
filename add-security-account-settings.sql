-- =====================================================
-- SECURITY & ACCOUNT SETTINGS MIGRATION
-- =====================================================
-- This script adds security (PIN/Password) and account settings
-- to the system_settings table
-- =====================================================

-- Ensure system_settings table exists
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECURITY SETTINGS
-- =====================================================

-- Insert PIN setting (if not exists)
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_pin', NULL, 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert Password setting (if not exists)
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('app_password', NULL, 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- ACCOUNT SETTINGS (Owner/Business Information)
-- =====================================================

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

-- =====================================================
-- BRANDING SETTINGS
-- =====================================================

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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key 
ON system_settings(setting_key);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE system_settings IS 'Stores all system configuration settings including security and account information';
COMMENT ON COLUMN system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN system_settings.setting_value IS 'The value of the setting (stored as text)';
COMMENT ON COLUMN system_settings.setting_type IS 'Data type of the setting (string, number, boolean)';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this to verify the settings were added:
-- SELECT setting_key, setting_type, 
--        CASE 
--          WHEN setting_key IN ('app_pin', 'app_password') THEN '***HIDDEN***'
--          ELSE setting_value 
--        END as setting_value
-- FROM system_settings 
-- WHERE setting_key IN (
--   'app_pin', 'app_password',
--   'owner_name', 'owner_email', 'owner_phone',
--   'business_name', 'business_address', 'business_phone', 
--   'business_email', 'business_tax_id', 'business_description'
-- )
-- ORDER BY setting_key;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. PIN and Password are stored as NULL by default (not set)
-- 2. PIN is stored as 6-digit string when set
-- 3. Password is stored as base64 encoded string (use proper hashing in production)
-- 4. Only ONE security method (PIN or Password) should be active at a time
-- 5. Account settings can be updated through the Settings page
-- 6. All sensitive data should be handled securely
-- =====================================================
