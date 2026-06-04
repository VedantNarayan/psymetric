-- Migration to add show_at_seconds to questions table and allow nullable selected_option_id in candidate_responses
-- Created at 2026-06-04

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS show_at_seconds integer DEFAULT 0;
ALTER TABLE public.candidate_responses ALTER COLUMN selected_option_id DROP NOT NULL;
