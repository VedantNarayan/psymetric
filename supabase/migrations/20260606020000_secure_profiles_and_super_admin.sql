-- Update trigger function to handle email, user_type, and automatic super_admin privileges for vedantnarayan13@gmail.com
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_user_type varchar(20);
  v_is_admin boolean;
begin
  -- Force super_admin for the requested email
  if new.email = 'vedantnarayan13@gmail.com' then
    v_user_type := 'super_admin';
    v_is_admin := true;
  else
    v_user_type := coalesce(new.raw_user_meta_data->>'user_type', 'student');
    v_is_admin := coalesce((new.raw_user_meta_data->>'is_admin')::boolean, v_user_type = 'super_admin' or v_user_type = 'school_admin');
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
    user_type = excluded.user_type,
    is_admin = excluded.is_admin;
    
  return new;
end;
$$ language plpgsql security definer;

-- Apply change retroactively to any existing profiles or users with that email
update public.profiles
set user_type = 'super_admin', is_admin = true
where email = 'vedantnarayan13@gmail.com' or id in (
  select id from auth.users where email = 'vedantnarayan13@gmail.com'
);
