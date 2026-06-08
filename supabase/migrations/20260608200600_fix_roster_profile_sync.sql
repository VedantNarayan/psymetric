-- Fix handle_new_user trigger to support student_roster claiming, correct profile first/last names, and metadata synchronization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type VARCHAR(20);
  v_is_admin BOOLEAN;
  v_school_id UUID := NULL;
  v_class_id UUID := NULL;
  v_roster_id UUID := NULL;
  v_first_name VARCHAR(100) := NULL;
  v_last_name VARCHAR(100) := NULL;
BEGIN
  -- Force super_admin for the whitelisted email
  IF new.email = 'vedantnarayan13@gmail.com' THEN
    v_user_type := 'super_admin';
    v_is_admin := true;
  ELSE
    -- Default to student/normal_user. Do NOT allow administrative elevation via raw_user_meta_data
    v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'student');
    IF v_user_type IN ('super_admin', 'school_admin') THEN
      v_user_type := 'student';
    END IF;
    v_is_admin := false;
  END IF;

  -- Look up student roster if access_code is provided and valid
  IF new.raw_user_meta_data->>'access_code' IS NOT NULL THEN
    SELECT id, school_id, class_id, first_name, last_name
    INTO v_roster_id, v_school_id, v_class_id, v_first_name, v_last_name
    FROM public.student_roster
    WHERE access_code = new.raw_user_meta_data->>'access_code'
      AND is_claimed = false
    LIMIT 1;

    IF v_roster_id IS NOT NULL THEN
      -- Mark roster code as claimed
      UPDATE public.student_roster
      SET is_claimed = true,
          claimed_by = new.id,
          claimed_at = now()
      WHERE id = v_roster_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    phone,
    full_name, 
    first_name,
    last_name,
    user_type, 
    age_tier, 
    institution_type, 
    is_admin,
    school_id,
    class_id,
    roster_id,
    gender,
    date_of_birth,
    age_group,
    current_status
  )
  VALUES (
    new.id,
    new.email,
    new.phone,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      CASE WHEN v_first_name IS NOT NULL THEN v_first_name || ' ' || COALESCE(v_last_name, '')
      ELSE COALESCE(SPLIT_PART(new.email, '@', 1), new.phone, 'User') END
    ),
    COALESCE(new.raw_user_meta_data->>'first_name', v_first_name, SPLIT_PART(COALESCE(new.raw_user_meta_data->>'full_name', ''), ' ', 1)),
    COALESCE(
      new.raw_user_meta_data->>'last_name', 
      v_last_name, 
      SUBSTRING(COALESCE(new.raw_user_meta_data->>'full_name', '') FROM POSITION(' ' IN COALESCE(new.raw_user_meta_data->>'full_name', '')) + 1)
    ),
    v_user_type,
    COALESCE(new.raw_user_meta_data->>'age_tier', 'College (18+)'),
    COALESCE(new.raw_user_meta_data->>'institution_type', CASE WHEN v_roster_id IS NOT NULL THEN 'School' ELSE 'College' END),
    v_is_admin,
    v_school_id,
    v_class_id,
    v_roster_id,
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'dob')::DATE,
    new.raw_user_meta_data->>'age_group',
    new.raw_user_meta_data->>'current_status'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = excluded.email,
    phone = excluded.phone,
    first_name = COALESCE(excluded.first_name, public.profiles.first_name),
    last_name = COALESCE(excluded.last_name, public.profiles.last_name),
    school_id = COALESCE(excluded.school_id, public.profiles.school_id),
    class_id = COALESCE(excluded.class_id, public.profiles.class_id),
    roster_id = COALESCE(excluded.roster_id, public.profiles.roster_id),
    gender = COALESCE(excluded.gender, public.profiles.gender),
    date_of_birth = COALESCE(excluded.date_of_birth, public.profiles.date_of_birth),
    age_group = COALESCE(excluded.age_group, public.profiles.age_group),
    current_status = COALESCE(excluded.current_status, public.profiles.current_status),
    user_type = CASE WHEN public.profiles.user_type IN ('super_admin', 'school_admin') THEN public.profiles.user_type ELSE excluded.user_type END,
    is_admin = CASE WHEN public.profiles.is_admin = true THEN true ELSE excluded.is_admin END;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
