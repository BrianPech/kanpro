-- Migration: Add demo_rollout configuration to system_settings and allow authenticated users to read it
-- Enables progressive weekly tool unlocking for participating DEMO companies

INSERT INTO public.system_settings (key, value, description)
VALUES (
    'demo_rollout',
    '{"activePhase": 1, "enabledModules": ["dashboard", "vacancies", "applications", "employees", "areas", "profile", "verification", "settings", "attendance"]}'::jsonb,
    'Control de fases semanales y herramientas habilitadas para empresas durante la DEMO'
)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'system_settings'
          AND policyname = 'Authenticated users can view demo_rollout'
    ) THEN
        CREATE POLICY "Authenticated users can view demo_rollout"
            ON public.system_settings
            FOR SELECT
            TO authenticated
            USING (key = 'demo_rollout');
    END IF;
END $$;
