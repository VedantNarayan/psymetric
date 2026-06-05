-- Add metadata columns to public.scenarios for matrix manager
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS status text DEFAULT 'Published';
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS expected_time integer DEFAULT 60;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS focus_category text DEFAULT 'STEM';
