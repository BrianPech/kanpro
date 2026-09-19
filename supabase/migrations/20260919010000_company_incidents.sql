-- Migration: 20260919010000_company_incidents.sql
-- Description: Creates company_incidents table for tracking labor incidents, administrative acts, leaves, unjustified absences and employee recognitions.

CREATE TABLE IF NOT EXISTS public.company_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.company_employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  job_title text,
  department text,
  category text NOT NULL CHECK (
    category IN ('falta_injustificada', 'retardo', 'accidente', 'queja', 'permiso', 'suspension', 'incumplimiento', 'reconocimiento', 'incapacidad', 'otro')
  ),
  category_label text,
  title text NOT NULL,
  description text NOT NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  severity text NOT NULL DEFAULT 'media' CHECK (
    severity IN ('baja', 'media', 'alta', 'critica')
  ),
  responsible_supervisor text,
  evidence_url text,
  evidence_file_name text,
  evidence_type text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (
    status IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'resuelto')
  ),
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_company_incidents_company ON public.company_incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_incidents_employee ON public.company_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_incidents_status ON public.company_incidents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_incidents_date ON public.company_incidents(incident_date DESC);

-- Enable RLS
ALTER TABLE public.company_incidents ENABLE ROW LEVEL SECURITY;

-- 1. Companies can view, insert, update, delete their own incidents
CREATE POLICY "Companies can manage own labor incidents"
  ON public.company_incidents
  FOR ALL
  TO authenticated
  USING (company_id = (select auth.uid()))
  WITH CHECK (company_id = (select auth.uid()));

-- 2. Employees can view their own incidents
CREATE POLICY "Employees can view own labor incidents"
  ON public.company_incidents
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- Grants
GRANT ALL ON TABLE public.company_incidents TO authenticated;
GRANT ALL ON TABLE public.company_incidents TO service_role;
