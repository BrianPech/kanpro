-- Migration: Fix Connections RLS for symmetrical insert
-- Created: 2026-07-07

DROP POLICY IF EXISTS "Insert connections" ON public.connections;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias conexiones" ON public.connections;
DROP POLICY IF EXISTS "Permitir inserción a la parte que inicia la conexión" ON public.connections;
DROP POLICY IF EXISTS "Permitir inserciones simétricas en connections" ON public.connections;

CREATE POLICY "Permitir inserciones simétricas en connections"
ON public.connections FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = candidate_id) OR 
  (auth.uid() = recruiter_id)
);
