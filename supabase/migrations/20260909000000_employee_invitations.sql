-- ============================================================================
-- K'anPro Migration: 20260909000000_employee_invitations.sql
-- Purpose: Intermediate table and onboarding workflow for employee invitations
-- ============================================================================

-- 1. Safely add 'pending' to employee_status enum if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' AND t.typname = 'employee_status' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.employee_status ADD VALUE 'pending' BEFORE 'onboarding';
  END IF;
END $$;

-- 2. Create public.employee_invitations table
CREATE TABLE IF NOT EXISTS public.employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.company_employees(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  salary NUMERIC(10,2),
  hire_date DATE,
  contract_type TEXT DEFAULT 'tiempo_indeterminado',
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_employee_invitations_company 
ON public.employee_invitations (company_id, status);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_email 
ON public.employee_invitations (lower(email));

CREATE INDEX IF NOT EXISTS idx_employee_invitations_token_hash 
ON public.employee_invitations (token_hash);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_employee_id 
ON public.employee_invitations (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_created_by 
ON public.employee_invitations (created_by);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Companies can view, create, update, and delete their own invitations
DROP POLICY IF EXISTS "Companies can manage own employee invitations" ON public.employee_invitations;
CREATE POLICY "Companies can manage own employee invitations"
ON public.employee_invitations
FOR ALL
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

-- 6. Trigger to automatically link employee when candidate signs up
CREATE OR REPLACE FUNCTION public.handle_employee_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Search for active/pending/sent invitations for this candidate's email
  FOR v_invitation IN
    SELECT *
    FROM public.employee_invitations
    WHERE lower(email) = lower(NEW.email)
      AND status IN ('pending', 'sent')
      AND expires_at > now()
    ORDER BY created_at DESC
  LOOP
    -- Ensure candidate_profiles exists so company_employees_employee_id_fkey constraint is satisfied
    INSERT INTO public.candidate_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- 1. Link company_employees
    IF v_invitation.employee_id IS NOT NULL THEN
      UPDATE public.company_employees
      SET employee_id = NEW.id,
          status = 'active',
          full_name = COALESCE(NULLIF(company_employees.full_name, ''), v_invitation.full_name),
          updated_at = now()
      WHERE id = v_invitation.employee_id;
    ELSE
      UPDATE public.company_employees
      SET employee_id = NEW.id,
          status = 'active',
          updated_at = now()
      WHERE company_id = v_invitation.company_id
        AND (employee_id IS NULL)
        AND lower(email) = lower(NEW.email);
    END IF;

    -- 2. Mark invitation as accepted
    UPDATE public.employee_invitations
    SET status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    WHERE id = v_invitation.id;

    -- 3. Notify the company
    INSERT INTO public.notifications (user_id, title, description, type)
    VALUES (
      v_invitation.company_id,
      'Colaborador se ha unido',
      v_invitation.full_name || ' ha completado su registro y se incorporó a tu plantilla de colaboradores.',
      'employee_joined'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Revoke execute from public/anon/authenticated on trigger function
REVOKE EXECUTE ON FUNCTION public.handle_employee_invitation_acceptance() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_employee_invitation_acceptance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_employee_invitation_acceptance() FROM authenticated;

-- Attach trigger to public.profiles (since profiles has the email column)
DROP TRIGGER IF EXISTS on_candidate_profile_linked_invitation ON public.profiles;
CREATE TRIGGER on_candidate_profile_linked_invitation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'candidate')
  EXECUTE FUNCTION public.handle_employee_invitation_acceptance();

-- 7. Grant proper table permissions to authenticated role for Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_invitations TO authenticated;
