-- Migration: Activate Week 2 in demo_rollout settings (unlocks leaves and incidents)

INSERT INTO public.system_settings (key, value, description)
VALUES (
    'demo_rollout',
    '{"activePhase": 2, "enabledModules": ["dashboard", "vacancies", "applications", "employees", "areas", "profile", "verification", "settings", "attendance", "contracts", "leaves", "incidents"]}'::jsonb,
    'Control de fases semanales y herramientas habilitadas para empresas durante la DEMO'
)
ON CONFLICT (key) DO UPDATE
SET
    value = EXCLUDED.value,
    updated_at = timezone('utc', now());
