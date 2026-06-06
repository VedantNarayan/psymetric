-- Drop check constraint on options target_dimension
-- This is necessary to support multiple/comma-separated dimensions and friendly dimension names (RPG classes) in diagnostic options.
ALTER TABLE public.options 
  DROP CONSTRAINT IF EXISTS options_target_dimension_check;
