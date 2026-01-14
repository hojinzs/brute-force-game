-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for block status
create type block_status as enum ('active', 'pending');

-- ============================================
-- PROFILES TABLE
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null unique,
  cp_count int not null default 50,
  last_cp_refill_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for profiles
alter table profiles enable row level security;

-- Profiles policies: Users can read all profiles but only update their own
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- BLOCKS TABLE
-- ============================================
create table blocks (
  id bigserial primary key,
  status block_status not null default 'active',
  seed_hint text not null,
  difficulty_config jsonb not null,
  answer_hash text not null,
  winner_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  solved_at timestamptz
);

-- Enable RLS for blocks
alter table blocks enable row level security;

-- Blocks policies: Everyone can read blocks, but answer_hash is protected by column-level security
create policy "Blocks are viewable by everyone"
  on blocks for select
  using (true);

-- Service role can do anything (for Edge Functions)
create policy "Service role can manage blocks"
  on blocks for all
  using (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- ATTEMPTS TABLE
-- ============================================
create table attempts (
  id uuid primary key default uuid_generate_v4(),
  block_id bigint not null references blocks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  input_value text not null,
  similarity float not null check (similarity >= 0 and similarity <= 100),
  created_at timestamptz not null default now()
);

-- Create index for faster queries
create index attempts_block_id_idx on attempts(block_id);
create index attempts_created_at_idx on attempts(created_at desc);
create index attempts_user_id_idx on attempts(user_id);

-- Enable RLS for attempts
alter table attempts enable row level security;

-- Attempts policies: Everyone can read attempts (for live feed)
create policy "Attempts are viewable by everyone"
  on attempts for select
  using (true);

-- Only authenticated users can insert attempts (via Edge Function)
create policy "Service role can insert attempts"
  on attempts for insert
  with check (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get current CP for a user (with auto-refill logic)
create or replace function get_current_cp(user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  current_cp int;
  last_refill timestamptz;
  minutes_passed int;
  refilled_cp int;
  final_cp int;
begin
  -- Get current CP and last refill time
  select cp_count, last_cp_refill_at
  into current_cp, last_refill
  from profiles
  where id = user_id;

  -- Calculate minutes passed since last refill
  minutes_passed := floor(extract(epoch from (now() - last_refill)) / 60);

  -- Calculate refilled CP (1 per minute, max 50)
  refilled_cp := current_cp + minutes_passed;
  final_cp := least(refilled_cp, 50);

  -- Update the profile with new values if minutes_passed > 0
  if minutes_passed > 0 then
    update profiles
    set 
      cp_count = final_cp,
      last_cp_refill_at = last_refill + (minutes_passed || ' minutes')::interval,
      updated_at = now()
    where id = user_id;
  end if;

  return final_cp;
end;
$$;

-- Function to consume CP (deduct 1 CP from user)
create or replace function consume_cp(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_cp int;
begin
  -- Get current CP (with auto-refill)
  current_cp := get_current_cp(user_id);

  -- Check if user has enough CP
  if current_cp <= 0 then
    return false;
  end if;

  -- Deduct 1 CP
  update profiles
  set cp_count = cp_count - 1, updated_at = now()
  where id = user_id;

  return true;
end;
$$;

-- Function to create profile on user signup (trigger)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, nickname, cp_count, last_cp_refill_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'Player_' || substr(new.id::text, 1, 8)),
    50,
    now()
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- REALTIME SETUP
-- ============================================

-- Enable realtime for attempts table (live feed)
alter publication supabase_realtime add table attempts;

-- Enable realtime for blocks table (block status changes)
alter publication supabase_realtime add table blocks;

-- ============================================
-- SEED DATA (Initial Block)
-- ============================================

-- Insert first block (for testing)
insert into blocks (seed_hint, difficulty_config, answer_hash, status)
values (
  'Welcome to Brute Force AI! This is a test block.',
  '{"length": 6, "charset": ["lowercase", "alphanumeric"]}'::jsonb,
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'active'
);
