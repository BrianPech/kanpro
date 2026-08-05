-- ============================================================================
-- Migration: 20260805000000_add_subscriptions.sql
-- Add Subscription & Featured Vacancies support for Companies
-- ============================================================================

-- 1. Add subscription columns to company_profiles
ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS featured_vacancies_allowance INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_vacancies_used INT NOT NULL DEFAULT 0;

-- 2. Add featured vacancy columns to vacancies
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- 3. Create company_invoices table for subscription billing history
CREATE TABLE IF NOT EXISTS public.company_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'MXN',
    status TEXT NOT NULL DEFAULT 'paid',
    payment_method TEXT DEFAULT 'Tarjeta / Transferencia',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for company_invoices
ALTER TABLE public.company_invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors
DROP POLICY IF EXISTS "Companies can view their own invoices" ON public.company_invoices;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.company_invoices;

-- RLS Policies
CREATE POLICY "Companies can view their own invoices"
    ON public.company_invoices FOR SELECT
    USING (auth.uid() = company_id);

CREATE POLICY "Admins can manage all invoices"
    ON public.company_invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
