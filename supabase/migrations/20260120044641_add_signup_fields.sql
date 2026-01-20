-- ============================================
-- SIGNUP FIELDS MIGRATION
-- ============================================
-- Add country, email_consent fields to profiles
-- For Issue #11: Signup experience improvements

-- ============================================
-- 1. ADD COLUMNS TO PROFILES
-- ============================================

-- Country: ISO-3166 alpha-2 code (e.g., 'KR', 'US', 'JP')
ALTER TABLE profiles 
ADD COLUMN country text;

-- Email consent: user agreed to receive notifications/marketing emails
ALTER TABLE profiles 
ADD COLUMN email_consent boolean NOT NULL DEFAULT false;

-- Email consent timestamp: when the user agreed
ALTER TABLE profiles 
ADD COLUMN email_consent_at timestamptz;

-- ============================================
-- 2. CREATE INDEX FOR COUNTRY-BASED RANKING
-- ============================================

CREATE INDEX profiles_country_idx ON profiles(country);

-- ============================================
-- 3. UPDATE TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    nickname, 
    cp_count, 
    last_cp_refill_at,
    country,
    email_consent,
    email_consent_at
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', 'Player_' || substr(new.id::text, 1, 8)),
    50,
    now(),
    new.raw_user_meta_data->>'country',
    coalesce((new.raw_user_meta_data->>'email_consent')::boolean, false),
    CASE 
      WHEN coalesce((new.raw_user_meta_data->>'email_consent')::boolean, false) = true 
      THEN now() 
      ELSE NULL 
    END
  );
  RETURN new;
END;
$$;

-- ============================================
-- 4. COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.country IS 'ISO-3166 alpha-2 country code (e.g., KR, US, JP). Used for country-based rankings.';
COMMENT ON COLUMN profiles.email_consent IS 'User consent to receive email notifications and marketing communications.';
COMMENT ON COLUMN profiles.email_consent_at IS 'Timestamp when the user gave email consent. NULL if consent was not given.';
