-- Remove foreign key constraint from public.archived_candidate_responses
-- This prevents the cold-storage archive records from being deleted when assessment_sessions are cleared during database restores/reverts.
ALTER TABLE public.archived_candidate_responses 
  DROP CONSTRAINT IF EXISTS archived_candidate_responses_session_id_fkey;
