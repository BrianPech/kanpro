-- ============================================================================
-- Migration: Add company_evaluations table for 360 Performance Reviews
-- Description: Non-destructive migration to store and manage 360 evaluations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.company_employees(id) ON DELETE SET NULL,
    evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    job_title TEXT,
    department TEXT,
    avatar_url TEXT,
    period TEXT NOT NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    evaluator_name TEXT NOT NULL,
    evaluator_role TEXT,
    
    -- 6 Core Competencies evaluated (1.0 to 5.0 scale)
    punctuality_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (punctuality_score >= 1 AND punctuality_score <= 5),
    attendance_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (attendance_score >= 1 AND attendance_score <= 5),
    productivity_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (productivity_score >= 1 AND productivity_score <= 5),
    teamwork_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (teamwork_score >= 1 AND teamwork_score <= 5),
    customer_service_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (customer_service_score >= 1 AND customer_service_score <= 5),
    goals_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (goals_score >= 1 AND goals_score <= 5),
    average_score NUMERIC(3,1) NOT NULL DEFAULT 5.0 CHECK (average_score >= 1 AND average_score <= 5),

    -- Qualitative Development Feedback
    strengths JSONB DEFAULT '[]'::jsonb,
    growth_areas JSONB DEFAULT '[]'::jsonb,
    development_plan TEXT,
    goals_achieved TEXT,
    comments TEXT,
    status TEXT NOT NULL DEFAULT 'completada' CHECK (status IN ('completada', 'borrador')),

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_evaluations_company_id ON public.company_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_evaluations_employee_id ON public.company_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_evaluations_date ON public.company_evaluations(evaluation_date DESC);

-- Enable RLS
ALTER TABLE public.company_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated Company Users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_evaluations' 
    AND policyname = 'Companies can view their own evaluations'
  ) THEN
    CREATE POLICY "Companies can view their own evaluations"
      ON public.company_evaluations
      FOR SELECT
      TO authenticated
      USING (company_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_evaluations' 
    AND policyname = 'Companies can insert evaluations'
  ) THEN
    CREATE POLICY "Companies can insert evaluations"
      ON public.company_evaluations
      FOR INSERT
      TO authenticated
      WITH CHECK (company_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_evaluations' 
    AND policyname = 'Companies can update their own evaluations'
  ) THEN
    CREATE POLICY "Companies can update their own evaluations"
      ON public.company_evaluations
      FOR UPDATE
      TO authenticated
      USING (company_id = auth.uid())
      WITH CHECK (company_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_evaluations' 
    AND policyname = 'Companies can delete their own evaluations'
  ) THEN
    CREATE POLICY "Companies can delete their own evaluations"
      ON public.company_evaluations
      FOR DELETE
      TO authenticated
      USING (company_id = auth.uid());
  END IF;
END $$;
