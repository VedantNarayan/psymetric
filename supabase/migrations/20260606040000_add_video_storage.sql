-- Create the videos bucket with a 500MB size limit and restriction to video formats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500MB limit for videos
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop existing policies if any (to avoid conflict)
DROP POLICY IF EXISTS "Public Select Videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins Insert Videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins Update Videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins Delete Videos" ON storage.objects;

-- Allow public read access to the videos bucket
CREATE POLICY "Public Select Videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Allow admins to insert/upload videos
CREATE POLICY "Admins Insert Videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    public.is_super_admin(auth.uid())
  );

-- Allow admins to update videos
CREATE POLICY "Admins Update Videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND 
    public.is_super_admin(auth.uid())
  );

-- Allow admins to delete videos
CREATE POLICY "Admins Delete Videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND 
    public.is_super_admin(auth.uid())
  );
