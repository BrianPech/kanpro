-- ============================================================================
-- Migration: 20260918030000_application_interview_fields.sql
-- Purpose: Add first-class scheduled_interview_at and interview_status columns
--          to public.applications, backfill existing values from interview_details,
--          and index for fast retrieval and lifecycle tracking.
--
-- STRICT GUARANTEE: Non-destructive migration. Preserves all existing rows.
-- ============================================================================

-- 1. ADD INTERVIEW COLUMNS TO public.applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS scheduled_interview_at timestamptz,
  ADD COLUMN IF NOT EXISTS interview_status text DEFAULT 'pending'
    CHECK (interview_status IN ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'));

-- 2. BACKFILL EXISTING VALUES FROM interview_details IF PRESENT
DO $$
BEGIN
  UPDATE public.applications
  SET 
    scheduled_interview_at = CASE 
      WHEN (interview_details->>'date') ~ '^\d{4}-\d{2}-\d{2}$' AND (interview_details->>'time') ~ '^\d{2}:\d{2}'
        THEN ((interview_details->>'date') || ' ' || (interview_details->>'time') || ':00')::timestamptz
      WHEN (interview_details->>'date') ~ '^\d{4}-\d{2}-\d{2}$'
        THEN ((interview_details->>'date') || ' 10:00:00')::timestamptz
      ELSE NULL
    END,
    interview_status = CASE 
      WHEN interview_details->>'status' IN ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed')
        THEN interview_details->>'status'
      ELSE 'pending'
    END
  WHERE interview_details IS NOT NULL AND scheduled_interview_at IS NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- In case of date parsing variations, leave null and continue safely
    NULL;
END $$;

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_applications_scheduled_interview 
  ON public.applications (scheduled_interview_at) 
  WHERE scheduled_interview_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_interview_status 
  ON public.applications (interview_status) 
  WHERE interview_status IS NOT NULL;
