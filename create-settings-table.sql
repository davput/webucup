-- Create System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
  category VARCHAR(50), -- pricing, stock, numbering, notification
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'System configuration and settings';

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- Pricing Settings
('default_margin', '20', 'number', 'pricing', 'Default profit margin percentage'),
('wholesale_min_quantity', '10', 'number', 'pricing', 'Minimum quantity for wholesale price'),
('wholesale_discount', '10', 'number', 'pricing', 'Wholesale discount percentage'),

-- Stock Settings
('minimum_stock_global', '5', 'number', 'stock', 'Global minimum stock threshold'),
('enable_low_stock_notification', 'true', 'boolean', 'stock', 'Enable low stock notifications'),
('enable_stock_movement_notification', 'true', 'boolean', 'stock', 'Enable stock in/out notifications'),

-- Numbering Format
('order_number_format', 'ORD-{YYYY}{MM}{DD}-{####}', 'string', 'numbering', 'Order number format'),
('delivery_number_format', 'DEL-{YYYY}{MM}{DD}-{####}', 'string', 'numbering', 'Delivery number format'),
('payment_number_format', 'PAY-{YYYY}{MM}{DD}-{####}', 'string', 'numbering', 'Payment number format'),
('invoice_number_format', 'INV-{YYYY}{MM}{DD}-{####}', 'string', 'numbering', 'Invoice number format'),

-- Notification Settings
('low_stock_threshold', '10', 'number', 'notification', 'Stock level to trigger low stock alert'),
('enable_email_notification', 'false', 'boolean', 'notification', 'Enable email notifications'),
('enable_whatsapp_notification', 'false', 'boolean', 'notification', 'Enable WhatsApp notifications')

ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
SELECT setting_key, setting_value, category, description 
FROM system_settings 
ORDER BY category, setting_key;
