-- Migration: 20260919030000_company_nom035.sql
-- Description: Creates table for NOM-035-STPS-2018 Psychosocial Risk & Work Climate Surveys

CREATE TABLE IF NOT EXISTS public.company_nom035_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.company_employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  job_title text,
  department text,
  guide_type text NOT NULL DEFAULT 'guia_ii' CHECK (guide_type IN ('guia_i', 'guia_ii', 'guia_iii')),
  survey_date date NOT NULL DEFAULT CURRENT_DATE,
  environment_score numeric(5, 2) NOT NULL DEFAULT 0,
  activity_factors_score numeric(5, 2) NOT NULL DEFAULT 0,
  time_organization_score numeric(5, 2) NOT NULL DEFAULT 0,
  leadership_relations_score numeric(5, 2) NOT NULL DEFAULT 0,
  organizational_climate_score numeric(5, 2) NOT NULL DEFAULT 0,
  total_score numeric(5, 2) NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'bajo' CHECK (risk_level IN ('nulo', 'bajo', 'medio', 'alto', 'muy_alto')),
  action_plan text,
  status text NOT NULL DEFAULT 'completada' CHECK (status IN ('borrador', 'completada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_nom035_company ON public.company_nom035_surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_company_nom035_emp ON public.company_nom035_surveys(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_nom035_date ON public.company_nom035_surveys(survey_date);

-- Enable RLS
ALTER TABLE public.company_nom035_surveys ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policy for companies
DROP POLICY IF EXISTS "company_nom035_company_access" ON public.company_nom035_surveys;
CREATE POLICY "company_nom035_company_access"
  ON public.company_nom035_surveys
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_company_nom035_updated_at ON public.company_nom035_surveys;
CREATE TRIGGER trigger_company_nom035_updated_at
  BEFORE UPDATE ON public.company_nom035_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
