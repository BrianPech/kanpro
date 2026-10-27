-- Migration: Fix vacancies active RLS policy
-- Ensures candidates and public users can query active vacancies aligned with the status domain ('Activa')

DROP POLICY IF EXISTS "Anyone can view active vacancies" ON public.vacancies;

CREATE POLICY "Anyone can view active vacancies"
    ON public.vacancies FOR SELECT
    USING (is_active = true AND status = 'Activa');
