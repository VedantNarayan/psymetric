-- Update sync_scenarios_snapshot function to support saving the timer_duration field for questions.
CREATE OR REPLACE FUNCTION public.sync_scenarios_snapshot(
  p_scenarios JSONB,
  p_description TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commit_hash VARCHAR(12);
  v_scenario JSONB;
  v_question JSONB;
  v_option JSONB;
  v_scenario_id UUID;
  v_question_id UUID;
  v_option_id UUID;
  v_imported_scen_ids UUID[] := '{}';
  v_imported_q_ids UUID[] := '{}';
  v_imported_opt_ids UUID[] := '{}';
BEGIN
  -- Check if caller is super_admin or admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can sync scenario snapshots.';
  END IF;

  -- 1. Loop and upsert scenarios, questions, options
  FOR v_scenario IN SELECT * FROM jsonb_array_elements(p_scenarios) LOOP
    v_scenario_id := (v_scenario->>'id')::UUID;
    v_imported_scen_ids := array_append(v_imported_scen_ids, v_scenario_id);

    INSERT INTO public.scenarios (
      id, title, video_url, target_age_group, is_active, is_backup, status, expected_time, focus_category
    ) VALUES (
      v_scenario_id,
      v_scenario->>'title',
      coalesce(v_scenario->>'video_url', ''),
      coalesce(v_scenario->>'target_age_group', 'All'),
      coalesce((v_scenario->>'is_active')::boolean, true),
      coalesce((v_scenario->>'is_backup')::boolean, false),
      coalesce(v_scenario->>'status', 'Published'),
      coalesce((v_scenario->>'expected_time')::integer, 60),
      coalesce(v_scenario->>'focus_category', 'STEM')
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      video_url = EXCLUDED.video_url,
      target_age_group = EXCLUDED.target_age_group,
      is_active = EXCLUDED.is_active,
      is_backup = EXCLUDED.is_backup,
      status = EXCLUDED.status,
      expected_time = EXCLUDED.expected_time,
      focus_category = EXCLUDED.focus_category;

    -- Questions
    IF v_scenario ? 'questions' AND jsonb_typeof(v_scenario->'questions') = 'array' THEN
      FOR v_question IN SELECT * FROM jsonb_array_elements(v_scenario->'questions') LOOP
        v_question_id := (v_question->>'id')::UUID;
        v_imported_q_ids := array_append(v_imported_q_ids, v_question_id);

        INSERT INTO public.questions (
          id, scenario_id, sequence_order, question_text, show_at_seconds, timer_duration
        ) VALUES (
          v_question_id,
          v_scenario_id,
          (v_question->>'sequence_order')::integer,
          v_question->>'question_text',
          coalesce((v_question->>'show_at_seconds')::integer, 0),
          coalesce((v_question->>'timer_duration')::integer, 15)
        )
        ON CONFLICT (id) DO UPDATE SET
          scenario_id = EXCLUDED.scenario_id,
          sequence_order = EXCLUDED.sequence_order,
          question_text = EXCLUDED.question_text,
          show_at_seconds = EXCLUDED.show_at_seconds,
          timer_duration = EXCLUDED.timer_duration;

        -- Options
        IF v_question ? 'options' AND jsonb_typeof(v_question->'options') = 'array' THEN
          FOR v_option IN SELECT * FROM jsonb_array_elements(v_question->'options') LOOP
            v_option_id := (v_option->>'id')::UUID;
            v_imported_opt_ids := array_append(v_imported_opt_ids, v_option_id);

            INSERT INTO public.options (
              id, question_id, option_letter, option_text, target_dimension, intensity_weight
            ) VALUES (
              v_option_id,
              v_question_id,
              (v_option->>'option_letter')::char(1),
              v_option->>'option_text',
              coalesce(v_option->>'target_dimension', ''),
              coalesce((v_option->>'intensity_weight')::float, 0.8)
            )
            ON CONFLICT (id) DO UPDATE SET
              question_id = EXCLUDED.question_id,
              option_letter = EXCLUDED.option_letter,
              option_text = EXCLUDED.option_text,
              target_dimension = EXCLUDED.target_dimension,
              intensity_weight = EXCLUDED.intensity_weight;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 2. Delete old child records for the active scenarios
  -- Options
  DELETE FROM public.options
  WHERE question_id IN (
    SELECT id FROM public.questions 
    WHERE scenario_id = ANY(v_imported_scen_ids)
  )
  AND NOT (id = ANY(v_imported_opt_ids));

  -- Questions
  DELETE FROM public.questions
  WHERE scenario_id = ANY(v_imported_scen_ids)
  AND NOT (id = ANY(v_imported_q_ids));

  -- Scenarios
  DELETE FROM public.scenarios
  WHERE NOT (id = ANY(v_imported_scen_ids));

  -- 3. Create scenario commit snapshot
  v_commit_hash := substring(md5(random()::text) from 1 for 6);
  
  INSERT INTO public.scenario_commits (
    commit_hash, description, scenarios_snapshot, created_by
  ) VALUES (
    v_commit_hash,
    coalesce(p_description, 'Auto-Commit: Bulk import via ledger transaction'),
    p_scenarios,
    p_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'commit_hash', v_commit_hash,
    'scenarios_count', cardinality(v_imported_scen_ids),
    'questions_count', cardinality(v_imported_q_ids)
  );
END;
$$;
