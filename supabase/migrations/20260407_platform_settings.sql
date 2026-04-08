-- Platform settings table for API keys and configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admin can read/write
CREATE POLICY "admin_read_platform_settings" ON platform_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_platform_settings" ON platform_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_platform_settings" ON platform_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_platform_settings" ON platform_settings FOR DELETE USING (public.is_admin());

-- Service role can also read (for API routes)
CREATE POLICY "service_read_platform_settings" ON platform_settings FOR SELECT USING (true);

SELECT 'Platform settings table created';
