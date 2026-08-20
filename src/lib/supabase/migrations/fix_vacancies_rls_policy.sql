-- Fix RLS policy on public.vacancies to allow candidates/public to view vacancies with status 'Activa' or 'activa' or 'published'

DROP POLICY IF EXISTS "Anyone can view active vacancies" ON public.vacancies;

CREATE POLICY "Anyone can view active vacancies"
ON public.vacancies
FOR SELECT
TO public
USING (is_active = true OR status IN ('Activa', 'activa', 'published', 'Publicada', 'active'));

