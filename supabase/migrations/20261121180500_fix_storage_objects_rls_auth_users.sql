-- Migration: 20261121180500_fix_storage_objects_rls_auth_users.sql
-- Description: Evita SELECT directo a auth.users en la política SELECT de storage.objects
-- para incident_evidence (causaba 42501 permission denied for table users al hacer upsert en Storage).

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
          OR lower(e.email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
        )
    )
  );
