-- =============================================
-- GEOGRAPHY (for cascading dropdowns)
-- =============================================
CREATE TABLE IF NOT EXISTS public.states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL PRIMARY KEY,
    state_id INT REFERENCES public.states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(state_id, name)
);

-- =============================================
-- SCHOOLS (created internally after deal closure)
-- =============================================
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    board VARCHAR(50) NOT NULL CHECK (board IN ('CBSE', 'ICSE', 'State Board')),
    city_id INT REFERENCES public.cities(id),
    address TEXT,
    logo_url TEXT,
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_name VARCHAR(10) NOT NULL,       -- "8", "9", "10", "11", "12"
    section_name VARCHAR(10) NOT NULL,     -- "A", "B", "C"
    stream VARCHAR(50),                    -- NULL for 8-10; "Science"/"Commerce"/"Humanities" for 11-12
    UNIQUE(school_id, class_name, section_name)
);

-- =============================================
-- STUDENT ROSTER & ACCESS CODES
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE,
    admission_no VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    access_code VARCHAR(50) UNIQUE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,
    UNIQUE(school_id, admission_no)
);

-- =============================================
-- USER PROFILES (unified profiles table adjustments)
-- =============================================
-- We check if we need to modify profiles to support the roadmap fields.
-- Let's alter profiles table:
DO $$ 
BEGIN
    -- Add user_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_type') THEN
        ALTER TABLE public.profiles ADD COLUMN user_type VARCHAR(20) DEFAULT 'student' CHECK (user_type IN ('student', 'school_admin', 'teacher', 'normal_user', 'parent', 'super_admin'));
    END IF;

    -- Add columns for student metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='first_name') THEN
        ALTER TABLE public.profiles ADD COLUMN first_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_name') THEN
        ALTER TABLE public.profiles ADD COLUMN last_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender VARCHAR(30);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
    END IF;

    -- Add school links
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='school_id') THEN
        ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='class_id') THEN
        ALTER TABLE public.profiles ADD COLUMN class_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='roster_id') THEN
        ALTER TABLE public.profiles ADD COLUMN roster_id UUID REFERENCES public.student_roster(id) ON DELETE SET NULL;
    END IF;

    -- Normal user metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age_group') THEN
        ALTER TABLE public.profiles ADD COLUMN age_group VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='current_status') THEN
        ALTER TABLE public.profiles ADD COLUMN current_status VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city_id') THEN
        ALTER TABLE public.profiles ADD COLUMN city_id INT REFERENCES public.cities(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- =============================================
-- TEACHER ↔ CLASS ASSIGNMENTS (school admin controls this)
-- =============================================
CREATE TABLE IF NOT EXISTS public.teacher_class_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.profiles(id),   -- the school_admin who granted access
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(teacher_id, class_id)
);

-- =============================================
-- PARENT ↔ STUDENT LINKS
-- =============================================
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    verified BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_id, student_id)
);

-- =============================================
-- ASSESSMENT CREDITS & PURCHASES
-- =============================================
CREATE TABLE IF NOT EXISTS public.assessment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,           -- "Quarterly Basic", "Annual Premium"
    assessments_included INT NOT NULL,    -- number of assessments in this plan
    validity_days INT NOT NULL,           -- how long credits last
    price_per_student NUMERIC NOT NULL,
    is_school_plan BOOLEAN DEFAULT TRUE,  -- school bundle vs individual purchase
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- school admin user or individual student
    plan_id UUID REFERENCES public.assessment_plans(id),
    school_id UUID REFERENCES public.schools(id),             -- NULL if purchased directly by student
    total_credits INT NOT NULL,
    used_credits INT DEFAULT 0,
    purchased_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    purchased_by VARCHAR(20) CHECK (purchased_by IN ('school', 'student', 'parent'))
);

-- =============================================
-- STUDENT TAGS & SEARCH METADATA
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,             -- "High Creative", "Needs Support", "Leadership Potential"
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tags ENABLE ROW LEVEL SECURITY;

-- Helper to check if a user is super_admin or admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND (user_type = 'super_admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple policies allowing reading states/cities
CREATE POLICY "Anyone can view states" ON public.states FOR SELECT USING (true);
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Anyone can view classes" ON public.school_classes FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins can do everything on states" ON public.states FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on cities" ON public.cities FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on schools" ON public.schools FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on classes" ON public.school_classes FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on rosters" ON public.student_roster FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on credits" ON public.assessment_credits FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can do everything on plans" ON public.assessment_plans FOR ALL USING (public.is_super_admin(auth.uid()));
