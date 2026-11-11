-- ======================================================================================
-- মেসার্স তন্ময় ভ্যারাইটি স্টোর (M/S Tonmoy Varity Store)
-- Migration: Password Reset OTPs Table
-- Description: Stores secure hashed OTPs with strict 2-minute (120s) expiration,
--              rate-limiting attempts, and short-lived reset authorization tokens.
-- ======================================================================================

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  reset_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  token_expires_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  verified_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying active OTPs by email
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email_created 
  ON public.password_reset_otps(email, created_at DESC);

-- Index for verifying reset authorization tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_reset_token 
  ON public.password_reset_otps(reset_token_hash);

-- Security: Enable Row Level Security (RLS)
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Deny all direct access to public/anon/authenticated roles.
-- Only backend service_role / postgres superuser can read or write OTP hashes.
DROP POLICY IF EXISTS "Deny direct client access to password reset otps" ON public.password_reset_otps;
CREATE POLICY "Deny direct client access to password reset otps"
  ON public.password_reset_otps
  FOR ALL
  TO public
  USING (false);

COMMENT ON TABLE public.password_reset_otps IS 'Stores cryptographically secure hashed OTPs with 120s expiration and 10min reset tokens';
