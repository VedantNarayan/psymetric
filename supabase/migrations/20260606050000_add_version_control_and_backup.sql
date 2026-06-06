-- Create scenario commits table
CREATE TABLE IF NOT EXISTS public.scenario_commits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  commit_hash VARCHAR(12) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  scenarios_snapshot JSONB NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create system backups table
CREATE TABLE IF NOT EXISTS public.system_backups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_name TEXT NOT NULL,
  backup_type VARCHAR(20) NOT NULL, -- 'Manual' or 'Scheduled'
  status VARCHAR(20) NOT NULL, -- 'Success' or 'Failed'
  file_path TEXT,
  profiles_count INTEGER DEFAULT 0 NOT NULL,
  schools_count INTEGER DEFAULT 0 NOT NULL,
  roster_count INTEGER DEFAULT 0 NOT NULL,
  scenarios_count INTEGER DEFAULT 0 NOT NULL,
  questions_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create private bucket 'backups' in storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  false, -- private bucket
  524288000, -- 500MB limit
  ARRAY['application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Enable RLS
ALTER TABLE public.scenario_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can do everything on scenario commits" ON public.scenario_commits;
DROP POLICY IF EXISTS "Admins can do everything on system backups" ON public.system_backups;
DROP POLICY IF EXISTS "Admins can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can select backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete backups" ON storage.objects;

-- Create Policies for Scenario Commits
CREATE POLICY "Admins can do everything on scenario commits" ON public.scenario_commits
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Create Policies for System Backups
CREATE POLICY "Admins can do everything on system backups" ON public.system_backups
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Create Policies for Backups Bucket in storage.objects
CREATE POLICY "Admins can upload backups" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'backups' AND 
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can select backups" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'backups' AND 
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Admins can delete backups" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'backups' AND 
    public.is_super_admin(auth.uid())
  );
