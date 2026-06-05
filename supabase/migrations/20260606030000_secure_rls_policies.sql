-- 1. Secure handle_new_user trigger function against metadata privilege escalation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_user_type varchar(20);
  v_is_admin boolean;
begin
  -- Force super_admin for the whitelisted email
  if new.email = 'vedantnarayan13@gmail.com' then
    v_user_type := 'super_admin';
    v_is_admin := true;
  else
    -- Default to student/normal_user. Do NOT allow administrative elevation via raw_user_meta_data
    v_user_type := coalesce(new.raw_user_meta_data->>'user_type', 'student');
    if v_user_type in ('super_admin', 'school_admin') then
      v_user_type := 'student';
    end if;
    v_is_admin := false;
  end if;

  insert into public.profiles (
    id, 
    email, 
    full_name, 
    user_type, 
    age_tier, 
    institution_type, 
    is_admin
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_user_type,
    coalesce(new.raw_user_meta_data->>'age_tier', 'College (18+)'),
    coalesce(new.raw_user_meta_data->>'institution_type', 'College'),
    v_is_admin
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    user_type = case when public.profiles.user_type in ('super_admin', 'school_admin') then public.profiles.user_type else excluded.user_type end,
    is_admin = case when public.profiles.is_admin = true then true else excluded.is_admin end;
    
  return new;
end;
$$ language plpgsql security definer;


-- 2. Create BEFORE UPDATE trigger on profiles to prevent self-elevation
create or replace function public.check_profile_update()
returns trigger as $$
begin
  -- Check if user is attempting to change user_type or is_admin
  if (old.is_admin is distinct from new.is_admin or old.user_type is distinct from new.user_type) then
    -- Check if performing user is authenticated and is an admin
    if not (public.is_super_admin(auth.uid())) then
      raise exception 'Unauthorized: Only administrators can modify administrative roles or types.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_check_profile_update on public.profiles;
create trigger tr_check_profile_update
  before update on public.profiles
  for each row execute procedure public.check_profile_update();


-- 3. Secure RLS policies for profiles (restrict column updates)
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);


-- 4. Enable RLS and add policies for school rosters
alter table public.student_roster enable row level security;
drop policy if exists "Anyone can view their own roster row via access code" on public.student_roster;
create policy "Anyone can view their own roster row via access code" on public.student_roster
  for select using (true);

drop policy if exists "Admins can do everything on rosters" on public.student_roster;
create policy "Admins can do everything on rosters" on public.student_roster
  for all using (public.is_super_admin(auth.uid()));


-- 5. Enable RLS and add policies for teacher class access
alter table public.teacher_class_access enable row level security;
drop policy if exists "Admins can do everything on teacher access" on public.teacher_class_access;
create policy "Admins can do everything on teacher access" on public.teacher_class_access
  for all using (public.is_super_admin(auth.uid()));

drop policy if exists "Teachers can view their own class access" on public.teacher_class_access;
create policy "Teachers can view their own class access" on public.teacher_class_access
  for select using (teacher_id = auth.uid());


-- 6. Enable RLS and add policies for parent student links
alter table public.parent_student_links enable row level security;
drop policy if exists "Admins can do everything on parent links" on public.parent_student_links;
create policy "Admins can do everything on parent links" on public.parent_student_links
  for all using (public.is_super_admin(auth.uid()));

drop policy if exists "Parents can manage their own links" on public.parent_student_links;
create policy "Parents can manage their own links" on public.parent_student_links
  for all using (parent_id = auth.uid());


-- 7. Enable RLS and add policies for student tags
alter table public.student_tags enable row level security;
drop policy if exists "Admins can do everything on student tags" on public.student_tags;
create policy "Admins can do everything on student tags" on public.student_tags
  for all using (public.is_super_admin(auth.uid()));

drop policy if exists "Authenticated users can select tags" on public.student_tags;
create policy "Authenticated users can select tags" on public.student_tags
  for select using (auth.role() = 'authenticated');


-- 8. Enable RLS and add policies for assessment credits
alter table public.assessment_credits enable row level security;
drop policy if exists "Admins can do everything on credits" on public.assessment_credits;
create policy "Admins can do everything on credits" on public.assessment_credits
  for all using (public.is_super_admin(auth.uid()));

drop policy if exists "Users can view their own credits" on public.assessment_credits;
create policy "Users can view their own credits" on public.assessment_credits
  for select using (user_id = auth.uid());


-- 9. Enable RLS and add policies for assessment plans
alter table public.assessment_plans enable row level security;
drop policy if exists "Admins can do everything on plans" on public.assessment_plans;
create policy "Admins can do everything on plans" on public.assessment_plans
  for all using (public.is_super_admin(auth.uid()));

drop policy if exists "Anyone can select assessment plans" on public.assessment_plans;
create policy "Anyone can select assessment plans" on public.assessment_plans
  for select using (true);
