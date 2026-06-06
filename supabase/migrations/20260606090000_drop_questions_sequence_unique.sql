-- Drop unique constraint on questions(scenario_id, sequence_order)
-- This is necessary to support multiple questions per set (sequence_order = 1, 2, or 3) for the same scenario.
ALTER TABLE public.questions 
  DROP CONSTRAINT IF EXISTS questions_scenario_id_sequence_order_key;
