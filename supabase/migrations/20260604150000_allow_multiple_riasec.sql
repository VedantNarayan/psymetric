-- Migration to drop the check constraint restricting options to a single target_dimension
-- This enables storing multiple RIASEC categories in a single text column as comma-separated values (e.g. 'Realistic, Investigative')

ALTER TABLE public.options DROP CONSTRAINT IF EXISTS options_target_dimension_check;
