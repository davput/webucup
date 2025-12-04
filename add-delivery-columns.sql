-- Set timezone to WIB (UTC+7)
SET timezone = 'Asia/Jakarta';

-- Add missing columns to delivery_orders table
ALTER TABLE delivery_orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);

-- Add missing columns to deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN delivery_orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON COLUMN delivery_orders.recipient_name IS 'Name of person who received the order';
COMMENT ON COLUMN deliveries.started_at IS 'Timestamp when delivery started';
COMMENT ON COLUMN deliveries.completed_at IS 'Timestamp when delivery completed';
COMMENT ON COLUMN deliveries.cancelled_at IS 'Timestamp when delivery was cancelled';
