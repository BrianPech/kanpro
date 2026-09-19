-- ============================================================================
-- Migration: 20260812000000_admin_staff_management.sql
-- Descripción: Tabla y políticas RLS para gestión de personal administrativo de K'anPro
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sub_role TEXT NOT NULL DEFAULT 'ops_admin',
  department TEXT DEFAULT 'Operaciones',
  permissions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_staff_profile_id ON public.admin_staff_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_sub_role ON public.admin_staff_members(sub_role);
CREATE INDEX IF NOT EXISTS idx_admin_staff_status ON public.admin_staff_members(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.admin_staff_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Solo administradores pueden gestionar miembros del personal administrativo
DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
CREATE POLICY "Admins can manage admin staff members" ON public.admin_staff_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = (SELECT auth.uid())
      AND public.profiles.role = 'admin'
    )
  );

-- Otorgar permisos a roles de Supabase
GRANT ALL ON public.admin_staff_members TO authenticated;
GRANT ALL ON public.admin_staff_members TO service_role;
