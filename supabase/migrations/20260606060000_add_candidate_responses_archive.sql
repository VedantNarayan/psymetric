-- Create archived candidate responses table
CREATE TABLE IF NOT EXISTS public.archived_candidate_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.assessment_sessions(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  selected_option_letter CHAR(1) NOT NULL,
  selected_option_text TEXT NOT NULL,
  target_dimension TEXT NOT NULL,
  intensity_weight FLOAT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create trigger function to snapshot responses before deletion
CREATE OR REPLACE FUNCTION public.archive_candidate_response()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_student_email TEXT;
  v_scenario_title TEXT;
  v_question_text TEXT;
  v_option_letter CHAR(1);
  v_option_text TEXT;
  v_target_dimension TEXT;
  v_intensity_weight FLOAT;
BEGIN
  -- 1. Get student details from assessment session profile
  SELECT p.full_name, p.email
  INTO v_student_name, v_student_email
  FROM public.assessment_sessions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.id = OLD.session_id;

  -- 2. Get scenario and question details
  SELECT sc.title, q.question_text
  INTO v_scenario_title, v_question_text
  FROM public.questions q
  JOIN public.scenarios sc ON sc.id = q.scenario_id
  WHERE q.id = OLD.question_id;

  -- 3. Get option details
  SELECT o.option_letter, o.option_text, o.target_dimension, o.intensity_weight
  INTO v_option_letter, v_option_text, v_target_dimension, v_intensity_weight
  FROM public.options o
  WHERE o.id = OLD.selected_option_id;

  -- 4. Write data to archived table
  INSERT INTO public.archived_candidate_responses (
    session_id,
    student_name,
    student_email,
    scenario_title,
    question_text,
    selected_option_letter,
    selected_option_text,
    target_dimension,
    intensity_weight,
    response_time_ms,
    created_at
  )
  VALUES (
    OLD.session_id,
    COALESCE(v_student_name, 'Unknown Student'),
    COALESCE(v_student_email, 'unknown@student.com'),
    COALESCE(v_scenario_title, 'Unknown Scenario'),
    COALESCE(v_question_text, 'Unknown Question'),
    COALESCE(v_option_letter, 'A'),
    COALESCE(v_option_text, 'Unknown Option'),
    COALESCE(v_target_dimension, 'STEM'),
    COALESCE(v_intensity_weight, 0.0),
    OLD.response_time_ms,
    OLD.created_at
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on candidate_responses
DROP TRIGGER IF EXISTS tr_archive_candidate_response ON public.candidate_responses;
CREATE TRIGGER tr_archive_candidate_response
  BEFORE DELETE ON public.candidate_responses
  FOR EACH ROW EXECUTE PROCEDURE public.archive_candidate_response();

-- Enable RLS
ALTER TABLE public.archived_candidate_responses ENABLE ROW LEVEL SECURITY;

-- Setup policy
DROP POLICY IF EXISTS "Admins can do everything on archived responses" ON public.archived_candidate_responses;
CREATE POLICY "Admins can do everything on archived responses" ON public.archived_candidate_responses
  FOR ALL USING (public.is_super_admin(auth.uid()));
