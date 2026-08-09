-- ============================================================================
-- Migration: 20260731000000_fix_table_grants.sql
-- Grant table privileges to authenticated and anon roles for RLS evaluation
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions for authenticated users on all tables (RLS handles record filtering)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant SELECT permissions for anon users where public read access is needed
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
