-- Add timer_duration column to public.questions table to set the overlay show timer's time.
-- Default is 15 seconds.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS timer_duration integer DEFAULT 15;
