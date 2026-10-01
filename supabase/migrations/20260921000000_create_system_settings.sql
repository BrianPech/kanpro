-- ============================================================================
-- Migration: 20260921000000_create_system_settings.sql
-- Description: System Settings table for K'anPro platform administration
-- ============================================================================

-- 1. Create table public.system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Index on updated_at for auditing
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON public.system_settings (updated_at);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Allow read and write only if auth.uid() has role='admin' in profiles
DROP POLICY IF EXISTS "Admins can view system_settings" ON public.system_settings;
CREATE POLICY "Admins can view system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "Admins can insert system_settings" ON public.system_settings;
CREATE POLICY "Admins can insert system_settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "Admins can update system_settings" ON public.system_settings;
CREATE POLICY "Admins can update system_settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "Admins can delete system_settings" ON public.system_settings;
CREATE POLICY "Admins can delete system_settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'::public.user_role
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

-- 4. Seed default system settings
INSERT INTO public.system_settings (key, value, description)
VALUES
  (
    'general',
    '{"appName": "K''anPro Platform", "language": "es", "timezone": "America/Mexico_City", "currency": "MXN"}'::jsonb,
    'Configuración global de la plataforma'
  ),
  (
    'security',
    '{"require2FA": true, "sessionTimeoutMinutes": 30, "maxLoginAttempts": 5}'::jsonb,
    'Políticas de seguridad, autenticación y sesiones'
  ),
  (
    'notifications',
    '{"candidateDailyDigest": true, "slaAlerts": true, "systemNotificationEmail": "admin@kanpro.com"}'::jsonb,
    'Preferencias y canales de notificaciones'
  ),
  (
    'privacy',
    '{"cvRetentionMonths": 12, "autoAnonymizeRejected": false}'::jsonb,
    'Políticas de retención y privacidad de postulantes'
  )
ON CONFLICT (key) DO NOTHING;
