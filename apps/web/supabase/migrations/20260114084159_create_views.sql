-- ============================================
-- CREATE VIEWS FOR SECURE PUBLIC ACCESS
-- ============================================

-- View: blocks_public (exposes blocks without answer_hash)
create or replace view blocks_public as
select 
  id,
  status,
  seed_hint,
  difficulty_config,
  winner_id,
  created_at,
  solved_at
from blocks;

-- Grant access to authenticated and anon users
grant select on blocks_public to authenticated, anon;

-- View: attempts_with_nickname (joins attempts with nickname)
create or replace view attempts_with_nickname as
select 
  a.id,
  a.block_id,
  a.user_id,
  a.input_value,
  a.similarity,
  a.created_at,
  p.nickname
from attempts a
left join profiles p on a.user_id = p.id;

-- Grant access to authenticated and anon users
grant select on attempts_with_nickname to authenticated, anon;

-- ============================================
-- FIX RPC FUNCTION PARAMETER
-- ============================================

-- Drop old functions first (PostgreSQL doesn't allow parameter name changes)
drop function if exists get_current_cp(uuid);
drop function if exists consume_cp(uuid);

-- Recreate get_current_cp with correct parameter name (p_user_id)
create or replace function get_current_cp(p_user_id uuid)
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
  where id = p_user_id;

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
    where id = p_user_id;
  end if;

  return final_cp;
end;
$$;

-- Recreate consume_cp with correct parameter name
create or replace function consume_cp(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_cp int;
begin
  -- Get current CP (with auto-refill)
  current_cp := get_current_cp(p_user_id);

  -- Check if user has enough CP
  if current_cp <= 0 then
    return false;
  end if;

  -- Deduct 1 CP
  update profiles
  set cp_count = cp_count - 1, updated_at = now()
  where id = p_user_id;

  return true;
end;
$$;
