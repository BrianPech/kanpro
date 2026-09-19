# Changes Summary — worker_db_m2 (Milestone 2)

**Agent**: Database / Supabase Worker (`worker_db_m2`)  
**Project**: K'anPro Admin Creation Security Hardening & Privilege Escalation Fix  
**Date**: 2026-08-26  

---

## 1. Files Created / Modified

### 1.1 `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` (New)
- **Purpose**: Implement Requirement R1 (Security Hardening for `handle_new_user()` trigger).
- **Key Changes**:
  - Sets `SECURITY DEFINER` with immutable `SET search_path = public, pg_temp;`.
  - Replaces vulnerable role parsing with strict logic:
    ```sql
    IF raw_role_str = 'company' THEN
      assigned_role := 'company'::public.user_role;
    ELSE
      assigned_role := 'candidate'::public.user_role;
    END IF;
    ```
    Strips all capability for user metadata (`raw_user_meta_data->>'role'`) to grant `'admin'` or `'super_admin'`.
  - Enforces conflict guard in `INSERT INTO public.profiles ... ON CONFLICT (id) DO UPDATE SET role = CASE WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role ELSE EXCLUDED.role END, ...` to prevent downgrade or corruption of existing admin accounts.
  - Preserves legitimate candidate profile creation and regex-based `birth_date` parsing (`DD/MM/YYYY` and `YYYY-MM-DD`) with sync to `public.candidate_private_profiles`.
  - Preserves company profile creation with default fields.
  - Revokes direct execute privileges from `PUBLIC`, `anon`, and `authenticated` to eliminate PostgREST RPC attack surface.
  - Recreates trigger `on_auth_user_created` idempotently on `auth.users`.

### 1.2 `docs/security/ADMIN_BOOTSTRAP.md` (New)
- **Purpose**: Implement Requirement R5 (Operational Secure Bootstrap Guide).
- **Key Content**:
  - Detailed zero-trust security architecture explaining why no public bootstrap endpoints exist.
  - Step-by-step instructions for creating the initial administrator via Supabase Auth + Supabase Studio SQL Editor.
  - Complete, parameterized PL/pgSQL DO block (`DO $$ ... $$;`) ensuring validation of `auth.users.id`, atomic profile upsert with `role = 'admin'`, and creation/upsert into `public.admin_staff_members` with root permissions.
  - SQL verification query and expected output.
  - Contingency and deactivation scripts.

---

## 2. Integrity Verification

- **Historical Migrations**: None modified. All historical migrations remain intact.
- **TypeScript Typecheck**: `npx tsc --noEmit` executed with 0 errors.
- **SQL Syntax and Standards**: Formatted according to Supabase Postgres best practices and strict RLS/SECURITY DEFINER isolation principles.
