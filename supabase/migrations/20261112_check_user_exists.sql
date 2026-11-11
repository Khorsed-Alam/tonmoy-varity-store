-- ======================================================================================
-- মেসার্স তন্ময় ভ্যারাইটি স্টোর (M/S Tonmoy Varity Store)
-- Migration: Check User Exists RPC Function
-- Description: Allows secure server-side check if a user is registered before sending OTP.
-- ======================================================================================

CREATE OR REPLACE FUNCTION public.check_user_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.check_user_exists(TEXT) IS 'Returns true if user exists in auth.users, false otherwise.';

