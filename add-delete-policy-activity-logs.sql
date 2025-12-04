-- Add DELETE policy for activity_logs
-- Jalankan di Supabase SQL Editor

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow delete activity logs" ON activity_logs;

-- Create policy untuk delete
CREATE POLICY "Allow delete activity logs" ON activity_logs
  FOR DELETE
  USING (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'activity_logs';
