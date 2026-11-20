-- Migration: 20261120230100_incidents_employee_response_evidence_payroll_config.sql
-- Description: Semana 2 / Parte 3A.
--   1. Notificación, aceptación y descargo del trabajador en company_incidents.
--   2. Bucket privado incident_evidence para evidencias (aislado por empresa).
--   3. Configuración de impacto en nómina por empresa (company_profiles.payroll_impact_config).

-- 1. Respuesta del trabajador ------------------------------------------------
ALTER TABLE public.company_incidents
  ADD COLUMN IF NOT EXISTS notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS employee_statement text,
  ADD COLUMN IF NOT EXISTS employee_statement_at timestamptz;

ALTER TABLE public.company_incidents
  DROP CONSTRAINT IF EXISTS company_incidents_employee_statement_length;
ALTER TABLE public.company_incidents
  ADD CONSTRAINT company_incidents_employee_statement_length
  CHECK (employee_statement IS NULL OR char_length(employee_statement) <= 2000);

-- El trabajador no tiene UPDATE directo sobre la tabla: solo puede escribir
-- sus propias columnas de respuesta mediante esta función.
CREATE OR REPLACE FUNCTION public.employee_respond_to_incident(
  p_incident_id uuid,
  p_acknowledge boolean,
  p_statement text
)
RETURNS public.company_incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.company_incidents;
  v_statement text := NULLIF(btrim(p_statement), '');
BEGIN
  UPDATE public.company_incidents i
  SET
    acknowledged_at = CASE WHEN p_acknowledge THEN COALESCE(i.acknowledged_at, now()) ELSE i.acknowledged_at END,
    employee_statement = COALESCE(v_statement, i.employee_statement),
    employee_statement_at = CASE WHEN v_statement IS NOT NULL THEN now() ELSE i.employee_statement_at END,
    updated_at = now()
  WHERE i.id = p_incident_id
    AND i.employee_id IN (
      SELECT e.id FROM public.company_employees e
      WHERE e.employee_id = (SELECT auth.uid())
         OR e.email = (SELECT u.email FROM auth.users u WHERE u.id = (SELECT auth.uid()))
    )
  RETURNING i.* INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Incidencia no encontrada o no autorizada.';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.employee_respond_to_incident(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employee_respond_to_incident(uuid, boolean, text) TO authenticated;

-- 2. Evidencias en Storage ---------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident_evidence',
  'incident_evidence',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ruta: {company_id}/{uuid}-{archivo}. La primera carpeta es la empresa dueña.
DROP POLICY IF EXISTS "Companies manage own incident evidence" ON storage.objects;
CREATE POLICY "Companies manage own incident evidence"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'incident_evidence'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN
        (storage.foldername(name))[1] = (SELECT auth.uid())::text
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin'])
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'incident_evidence'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN
        (storage.foldername(name))[1] = (SELECT auth.uid())::text
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin'])
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Employees read own incident evidence" ON storage.objects;
CREATE POLICY "Employees read own incident evidence"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'incident_evidence'
    AND EXISTS (
      SELECT 1
      FROM public.company_incidents i
      JOIN public.company_employees e ON e.id = i.employee_id
      WHERE i.evidence_url = storage.objects.name
        AND (
          e.employee_id = (SELECT auth.uid())
          OR e.email = (SELECT u.email FROM auth.users u WHERE u.id = (SELECT auth.uid()))
        )
    )
  );

-- 3. Configuración de impacto en nómina por empresa -------------------------
-- Forma: {"delaysPerAbsence": 3, "recognitionBonusDays": 1}. NULL = valores por defecto.
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS payroll_impact_config jsonb;
