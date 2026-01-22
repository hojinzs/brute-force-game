-- Add is_anonymous column to profiles
alter table profiles add column if not exists is_anonymous boolean default false;

-- Update handle_new_user function to handle anonymous users
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  is_anon boolean;
begin
  -- Check if user is anonymous (using is_anonymous column from auth.users)
  -- Note: new.is_anonymous is available in Supabase Auth
  is_anon := (new.is_anonymous is true);

  insert into public.profiles (
    id,
    nickname,
    cp_count,
    last_cp_refill_at,
    is_anonymous,
    country,
    email_consent,
    email_consent_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'Player_' || substr(new.id::text, 1, 8)),
    case when is_anon then 5 else 50 end,
    now(),
    is_anon,
    new.raw_user_meta_data->>'country',
    coalesce((new.raw_user_meta_data->>'email_consent')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data->>'email_consent')::boolean, false) = true
      then now()
      else null
    end
  );
  return new;
end;
$$;

-- Prevent clients from toggling is_anonymous directly
create or replace function prevent_is_anonymous_update()
returns trigger
language plpgsql
as $$
begin
  if new.is_anonymous is distinct from old.is_anonymous then
    if auth.uid() is null then
      return new;
    end if;

    if coalesce(auth.jwt()->>'role', '') = 'service_role' then
      return new;
    end if;

    raise exception 'is_anonymous cannot be updated directly';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_is_anonymous_update on profiles;
create trigger prevent_is_anonymous_update
before update on profiles
for each row execute function prevent_is_anonymous_update();

-- Update get_current_cp function to skip refill for anonymous users
drop function if exists get_current_cp(uuid);
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
  is_anon boolean;
begin
  -- Get current CP, last refill time, and is_anonymous status
  select cp_count, last_cp_refill_at, is_anonymous
  into current_cp, last_refill, is_anon
  from profiles
  where id = user_id;

  -- If anonymous, return current CP without refill logic
  if is_anon then
    return current_cp;
  end if;

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
