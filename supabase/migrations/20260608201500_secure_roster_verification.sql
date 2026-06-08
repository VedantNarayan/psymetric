-- Secure student roster code verification via database function
-- 1. Remove public select policy from student_roster table
DROP POLICY IF EXISTS "Anyone can view their own roster row via access code" ON public.student_roster;

-- 2. Create RPC lookup function
CREATE OR REPLACE FUNCTION public.verify_roster_code(p_access_code TEXT)
RETURNS TABLE (
  id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  school_name VARCHAR(255),
  class_name VARCHAR(10),
  section_name VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.first_name,
    r.last_name,
    s.name::VARCHAR(255) as school_name,
    c.class_name::VARCHAR(10) as class_name,
    c.section_name::VARCHAR(10) as section_name
  FROM public.student_roster r
  LEFT JOIN public.schools s ON r.school_id = s.id
  LEFT JOIN public.school_classes c ON r.class_id = c.id
  WHERE r.access_code = p_access_code
    AND r.is_claimed = false
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute access to anyone (including anonymous users) so they can verify codes on signup
GRANT EXECUTE ON FUNCTION public.verify_roster_code(TEXT) TO anon, authenticated;
