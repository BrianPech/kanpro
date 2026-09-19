-- Migration: 20260919000000_company_attendance.sql
-- Description: Creates company_attendance table for real-time employee attendance tracking (GPS, QR, Manual), overtime authorization and medical/labor justifications.

CREATE TABLE IF NOT EXISTS public.company_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.company_employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  scheduled_check_in text NOT NULL DEFAULT '08:00',
  scheduled_check_out text NOT NULL DEFAULT '17:00',
  check_in_time text,
  check_out_time text,
  break_start_time text,
  break_end_time text,
  check_in_method text NOT NULL DEFAULT 'manual' CHECK (check_in_method IN ('gps', 'qr', 'manual')),
  check_in_lat numeric,
  check_in_lng numeric,
  check_in_accuracy numeric,
  check_in_distance_meters numeric,
  delay_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'presente' CHECK (
    status IN ('presente', 'retardo', 'falta_injustificada', 'falta_justificada', 'descanso', 'vacaciones', 'incapacidad')
  ),
  overtime_hours numeric(4,2) NOT NULL DEFAULT 0.0,
  overtime_status text CHECK (overtime_status IN ('pendiente', 'autorizado', 'rechazado')),
  overtime_rate_type text CHECK (overtime_rate_type IN ('doble', 'triple')),
  overtime_notes text,
  justification_reason_type text CHECK (justification_reason_type IN ('medica', 'transporte', 'fuerza_mayor', 'personal')),
  justification_label text,
  justification_comments text,
  justification_evidence_url text,
  justification_status text CHECK (justification_status IN ('pendiente', 'aprobada', 'rechazada')),
  justification_submitted_at timestamptz,
  justification_reviewed_at timestamptz,
  justification_reviewed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_attendance_emp_date_unique UNIQUE (company_id, employee_id, work_date)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_company_attendance_company_date ON public.company_attendance(company_id, work_date);
CREATE INDEX IF NOT EXISTS idx_company_attendance_employee ON public.company_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_attendance_status ON public.company_attendance(company_id, status);

-- Enable RLS
ALTER TABLE public.company_attendance ENABLE ROW LEVEL SECURITY;

-- 1. Companies can view, insert, update, delete their own attendance records
CREATE POLICY "Companies can manage own attendance records"
  ON public.company_attendance
  FOR ALL
  TO authenticated
  USING (company_id = (select auth.uid()))
  WITH CHECK (company_id = (select auth.uid()));

-- 2. Employees can view their own attendance records
CREATE POLICY "Employees can view own attendance records"
  ON public.company_attendance
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- 3. Employees can register their own check-in (mobile GPS / QR)
CREATE POLICY "Employees can insert own check-in attendance"
  ON public.company_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- 4. Employees can update their own check-out / breaks
CREATE POLICY "Employees can update own check-in attendance"
  ON public.company_attendance
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- Grants
GRANT ALL ON TABLE public.company_attendance TO authenticated;
GRANT ALL ON TABLE public.company_attendance TO service_role;
