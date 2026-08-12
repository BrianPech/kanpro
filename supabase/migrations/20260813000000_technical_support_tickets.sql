-- ============================================================================
-- Migration: 20260813000000_technical_support_tickets.sql
-- Descripción: Tablas y RLS para el portal de Soporte Técnico y Tickets en K'anPro
-- ============================================================================

-- 1. Tabla de Tickets de Soporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'cuenta_acceso',
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'abierto',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Mensajes e Historial del Ticket
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuarios ven sus propios tickets; Administradores gestionan todos los tickets
DROP POLICY IF EXISTS "Users view own support tickets" ON public.support_tickets;
CREATE POLICY "Users view own support tickets" ON public.support_tickets
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users create own support tickets" ON public.support_tickets;
CREATE POLICY "Users create own support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;
CREATE POLICY "Admins manage all support tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid())
      AND public.profiles.role = 'admin'
    )
  );

-- Políticas RLS para mensajes
DROP POLICY IF EXISTS "Users view non-internal ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Users view non-internal ticket messages" ON public.support_ticket_messages
  FOR SELECT USING (
    is_internal_note = FALSE
    AND EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE public.support_tickets.id = ticket_id
      AND public.support_tickets.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins manage all support ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Admins manage all support ticket messages" ON public.support_ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid())
      AND public.profiles.role = 'admin'
    )
  );

-- Otorgar permisos
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
