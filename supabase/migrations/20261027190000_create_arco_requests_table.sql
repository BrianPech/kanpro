-- Migration: 20261027190000_create_arco_requests_table.sql
-- Description: Audit table for Mexican LFPDPPP / ARCO rights requests and profile status support.

-- 1. Ensure status column exists on public.profiles and allow null whatsapp_number for anonymized accounts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  ALTER COLUMN whatsapp_number DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Create arco_requests table
CREATE TABLE IF NOT EXISTS public.arco_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  request_type text NOT NULL DEFAULT 'cancellation',
  reason text,
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE public.arco_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own arco requests" ON public.arco_requests;
CREATE POLICY "Users view own arco requests" ON public.arco_requests
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own arco requests" ON public.arco_requests;
CREATE POLICY "Users insert own arco requests" ON public.arco_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all arco requests" ON public.arco_requests;
CREATE POLICY "Admins manage all arco requests" ON public.arco_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. Grants & Indexes
GRANT ALL ON public.arco_requests TO authenticated;
GRANT ALL ON public.arco_requests TO service_role;

CREATE INDEX IF NOT EXISTS idx_arco_requests_user ON public.arco_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_arco_requests_created_at ON public.arco_requests(created_at DESC);
