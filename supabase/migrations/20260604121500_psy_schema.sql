-- PsyMetric Enterprise Platform Schema Migration
-- Created at 2026-06-04

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  age_tier text not null, -- e.g. "School (13-15)", "College (18+)"
  institution_type text not null, -- "School" or "College"
  is_admin boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Scenarios Table
create table if not exists public.scenarios (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  video_url text not null, -- Supabase Storage bucket URL or public path
  target_age_group text not null, -- "School", "College", or "All"
  is_active boolean default true not null,
  is_backup boolean default false not null, -- backup extension scenarios
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Questions Table
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  sequence_order integer not null,
  question_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(scenario_id, sequence_order)
);

-- 4. Options Table
create table if not exists public.options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  option_letter char(1) not null, -- 'A', 'B', 'C', 'D'
  option_text text not null,
  target_dimension text not null check (target_dimension in ('Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional')),
  intensity_weight float not null check (intensity_weight >= 0.0 and intensity_weight <= 1.0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(question_id, option_letter)
);

-- 5. Assessment Sessions Table
create table if not exists public.assessment_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_completed boolean default false not null,
  theta_vector jsonb default '{"R": 0.0, "I": 0.0, "A": 0.0, "S": 0.0, "E": 0.0, "C": 0.0, "counts": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}}'::jsonb not null,
  is_cheat_flagged boolean default false not null,
  cheat_reason text,
  is_extended boolean default false not null,
  total_extended_scenarios integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Candidate Responses Table
create table if not exists public.candidate_responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.assessment_sessions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option_id uuid references public.options(id) on delete cascade not null,
  response_time_ms integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, question_id)
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.candidate_responses enable row level security;

-- Helper function to bypass RLS recursion for admin checks
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles where id = user_id and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Create Policies

-- Profiles Policies
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can do everything on profiles" on public.profiles
  for all using (public.is_admin(auth.uid()));

-- Scenarios Policies
create policy "Authenticated users can view scenarios" on public.scenarios
  for select using (auth.role() = 'authenticated');

create policy "Admins can do everything on scenarios" on public.scenarios
  for all using (public.is_admin(auth.uid()));

-- Questions Policies
create policy "Authenticated users can view questions" on public.questions
  for select using (auth.role() = 'authenticated');

create policy "Admins can do everything on questions" on public.questions
  for all using (public.is_admin(auth.uid()));

-- Options Policies
create policy "Authenticated users can view options" on public.options
  for select using (auth.role() = 'authenticated');

create policy "Admins can do everything on options" on public.options
  for all using (public.is_admin(auth.uid()));

-- Sessions Policies
create policy "Users can view their own sessions" on public.assessment_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions" on public.assessment_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions" on public.assessment_sessions
  for update using (auth.uid() = user_id);

create policy "Admins can do everything on sessions" on public.assessment_sessions
  for all using (public.is_admin(auth.uid()));

-- Candidate Responses Policies
create policy "Users can view their own responses" on public.candidate_responses
  for select using (
    exists (
      select 1 from public.assessment_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own responses" on public.candidate_responses
  for insert with check (
    exists (
      select 1 from public.assessment_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Admins can do everything on responses" on public.candidate_responses
  for all using (public.is_admin(auth.uid()));


-- Automatic user profile creation trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, age_tier, institution_type, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
    coalesce(new.raw_user_meta_data->>'age_tier', 'College (18+)'),
    coalesce(new.raw_user_meta_data->>'institution_type', 'College'),
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
