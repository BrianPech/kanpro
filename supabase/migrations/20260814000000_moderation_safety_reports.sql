-- ============================================================================
-- Migration: 20260814000000_moderation_safety_reports.sql
-- Descripción: Tabla y políticas RLS para la Bandeja de Moderación y Reportes de Vacantes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vacancy_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'cobro_dinero', -- 'cobro_dinero', 'vacante_falsa', 'discriminacion', 'suplantacion', 'condiciones_abusivas'
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
  action_taken TEXT, -- 'vacancy_deactivated', 'user_banned', 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_vacancy_reports_vacancy ON public.vacancy_reports(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_reports_status ON public.vacancy_reports(status);
CREATE INDEX IF NOT EXISTS idx_vacancy_reports_reason ON public.vacancy_reports(reason);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vacancy_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Candidatos y usuarios autenticados pueden crear reportes; Administradores gestionan todo
DROP POLICY IF EXISTS "Authenticated users create reports" ON public.vacancy_reports;
CREATE POLICY "Authenticated users create reports" ON public.vacancy_reports
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Admins manage all vacancy reports" ON public.vacancy_reports;
CREATE POLICY "Admins manage all vacancy reports" ON public.vacancy_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid())
      AND public.profiles.role = 'admin'
    )
  );

-- Otorgar permisos
GRANT ALL ON public.vacancy_reports TO authenticated;
GRANT ALL ON public.vacancy_reports TO service_role;
