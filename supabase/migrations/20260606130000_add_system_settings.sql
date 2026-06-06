-- Migration to add system_settings table and default timer settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow all authenticated users to read settings
CREATE POLICY "Allow read for authenticated users" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

-- Insert/Update/Delete policy: Allow super admins to do everything
CREATE POLICY "Allow full control for super admins" ON public.system_settings
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- Insert the default overlay timer setting (default = 15 seconds)
INSERT INTO public.system_settings (key, value)
VALUES ('default_overlay_timer', '15')
ON CONFLICT (key) DO NOTHING;
