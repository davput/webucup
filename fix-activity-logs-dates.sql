-- Fix Activity Logs Dates
-- Jalankan di Supabase SQL Editor

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Update semua record yang created_at nya null atau epoch
UPDATE activity_logs 
SET created_at = NOW() 
WHERE created_at IS NULL 
   OR created_at = '1970-01-01 00:00:00'::timestamptz
   OR created_at < '2024-01-01'::timestamptz;

-- Verify
SELECT 
  id,
  user_name,
  action,
  entity_name,
  created_at,
  created_at AT TIME ZONE 'Asia/Jakarta' as created_at_wib
FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;
