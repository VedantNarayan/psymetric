-- Add phone column to public.profiles and update handle_new_user trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type VARCHAR(20);
  v_is_admin BOOLEAN;
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

  INSERT INTO public.profiles (
    id, 
    email, 
    phone,
    full_name, 
    user_type, 
    age_tier, 
    institution_type, 
    is_admin
  )
  VALUES (
    new.id,
    new.email,
    new.phone,
    COALESCE(new.raw_user_meta_data->>'full_name', COALESCE(SPLIT_PART(new.email, '@', 1), new.phone, 'User')),
    v_user_type,
    COALESCE(new.raw_user_meta_data->>'age_tier', 'College (18+)'),
    COALESCE(new.raw_user_meta_data->>'institution_type', 'College'),
    v_is_admin
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = excluded.email,
    phone = excluded.phone,
    user_type = CASE WHEN public.profiles.user_type IN ('super_admin', 'school_admin') THEN public.profiles.user_type ELSE excluded.user_type END,
    is_admin = CASE WHEN public.profiles.is_admin = true THEN true ELSE excluded.is_admin END;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
