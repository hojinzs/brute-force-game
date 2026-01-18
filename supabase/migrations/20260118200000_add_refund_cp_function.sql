-- ============================================
-- CP REFUND FUNCTION
-- ============================================
-- Add function to safely refund CP to users
-- Used when block becomes inactive or race condition occurs

CREATE OR REPLACE FUNCTION refund_cp(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_cp bigint;
BEGIN
  -- Get current CP (with time-based regeneration)
  current_cp := get_current_cp(p_user_id);
  
  -- Update profile with refunded CP
  UPDATE profiles
  SET cp_count = current_cp,
      updated_at = now()
  WHERE id = p_user_id;
  
  RETURN current_cp;
END;
$$;
