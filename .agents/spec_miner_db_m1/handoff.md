# Database Schema Spec Miner Handoff Report — Milestone 1

**Agent**: Database Schema Spec Miner (`spec_miner_db_m1`)  
**Timestamp**: 2026-08-26T11:05:00Z  
**Handoff Type**: Hard (Task Complete)  
**Destination Path**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/handoff.md`  

---

## 1. Observation

1. **Trigger Vulnerability in Existing Migrations**:
   - In `supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` (lines 17–23 and lines 33–37):
     ```sql
     17:   IF raw_role_str = 'company' THEN
     18:     assigned_role := 'company'::public.user_role;
     19:   ELSIF raw_role_str = 'admin' THEN
     20:     assigned_role := 'admin'::public.user_role;
     21:   ELSE
     22:     assigned_role := 'candidate'::public.user_role;
     23:   END IF;
     ...
     33:   ON CONFLICT (id) DO UPDATE SET
     34:     role = EXCLUDED.role,
     35:     full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
     36:     whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number),
     37:     updated_at = NOW();
     ```
   - In `supabase/migrations/20260728000000_initial_schema.sql` (lines 331–333):
     ```sql
     331: CREATE OR REPLACE TRIGGER on_auth_user_created
     332:   AFTER INSERT ON auth.users
     333:   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
     ```
   - In `supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` (line 6):
     ```sql
     6: SET search_path = public
     ```
     (Note: `pg_temp` is absent in `search_path`).

2. **Schema and Constraints**:
   - `public.profiles`: `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `role public.user_role NOT NULL DEFAULT 'candidate'`.
   - `public.candidate_profiles`: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`.
   - `public.candidate_private_profiles`: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `birth_date DATE`.
   - `public.company_profiles`: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `company_name TEXT NOT NULL`, `rfc VARCHAR(13) NOT NULL`, `fiscal_address TEXT NOT NULL`, `industry TEXT NOT NULL`.
   - `public.admin_staff_members`: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `sub_role TEXT NOT NULL DEFAULT 'ops_admin'`, `permissions TEXT[] DEFAULT '{}'`.

3. **Backend Flaw in `createAdminStaffMember`**:
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 123–142):
     ```typescript
     123: const { data: authData, error: authErr } = await supabase.auth.signUp({
     124:   email: cleanEmail,
     125:   password: formData.password.trim(),
     126:   options: {
     127:     data: {
     128:       full_name: formData.name,
     129:       role: "admin",
     130:     },
     131:   },
     132: });
     ...
     136:   targetProfileId = crypto.randomUUID();
     ```
   - In `src/app/(auth)/auth/callback/route.ts` (lines 30–38):
     Accepts `searchRole === "admin"` or `metaRole === "admin"`.
   - In `src/modules/auth/services/dashboard-session.ts` (lines 13–33):
     Checks `user.user_metadata?.role` before checking `profiles.role`.

---

## 2. Logic Chain

1. **Step 1 (Observation 1 -> Trigger Vulnerability)**: Because `handle_new_user()` in `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` contains `ELSIF raw_role_str = 'admin' THEN assigned_role := 'admin'`, any client invoking `signUp()` with `{ data: { role: 'admin' } }` causes PostgreSQL to insert a row into `public.profiles` with `role = 'admin'`.
2. **Step 2 (Observation 1 -> ON CONFLICT Degradation Risk)**: Because line 34 specifies `role = EXCLUDED.role`, if an existing admin triggers an `ON CONFLICT` during re-authentication or upsert, their role will be overwritten by whatever role is calculated from the trigger payload. If the trigger is fixed to default to `'candidate'`, without a conditional guard, re-triggering would downgrade legitimate admins to `'candidate'`.
3. **Step 3 (Observation 1 & 2 -> Remediation Design)**: To enforce Requirement R1, `handle_new_user()` must:
   - Assign `'company'::public.user_role` ONLY when `raw_role_str = 'company'`.
   - Default all other inputs to `'candidate'::public.user_role`.
   - In `ON CONFLICT (id) DO UPDATE`, use `role = CASE WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role ELSE EXCLUDED.role END` to prevent downgrade of existing admins.
   - Set `search_path = public, pg_temp;` for `SECURITY DEFINER` function integrity.
   - Recreate the trigger `on_auth_user_created AFTER INSERT ON auth.users`.
4. **Step 4 (Observation 2 & 3 -> Bootstrap and Staff Flow)**: Because `profiles` requires `REFERENCES auth.users(id)` and `admin_staff_members` requires `REFERENCES public.profiles(id)`:
   - The first admin must be bootstrapped via direct SQL promotion (Requirement R5).
   - All subsequent admins must be created by an authenticated admin using `createAdminClient()` (Service Role) calling `auth.admin.createUser()`, awaiting base profile creation by the trigger, updating `profiles.role = 'admin'`, and inserting into `admin_staff_members`.

---

## 3. Caveats

- **Historical Migrations**: Per the immutable migration rule ("NO modificar migraciones históricas ya aplicadas"), historical migrations (`20260728000000`, `20260815030000`, `20260815034500`) must NOT be edited. The fix must be delivered in a new migration file (e.g. `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`).
- **PostgREST RPC Exposure**: Even though `handle_new_user()` is a trigger function, Postgres allows public execute by default on functions created in `public`. Explicit `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;` is mandatory.

---

## 4. Conclusion

1. The exact, authoritative SQL migration for Requirement R1 has been fully designed and verified for idempotency, security definer isolation, metadata parsing, candidate defaulting, and admin preservation on conflict.
2. The operational SQL procedure for Requirement R5 (secure bootstrap of the initial super admin) has been fully documented with verification queries.
3. Complete schema tables, column types, enums, triggers, and foreign keys have been cataloged in `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/analysis.md`.

---

## 5. Verification Method

1. **Verify Analysis Artifacts**:
   - Inspect `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/analysis.md`.
   - Confirm table column mappings match `supabase/migrations/` and `src/types/supabase.ts`.
2. **Verify SQL Migration Syntax & Logic**:
   - Review the SQL function in `analysis.md` §6:
     - Check `SECURITY DEFINER` and `SET search_path = public, pg_temp`.
     - Check `IF raw_role_str = 'company' THEN 'company' ELSE 'candidate' END`.
     - Check `ON CONFLICT (id) DO UPDATE SET role = CASE WHEN public.profiles.role = 'admin' ...`.
     - Check `REVOKE EXECUTE` statements.
3. **Verify Bootstrap Script**:
   - Review the DO block in `analysis.md` §7:
     - Check presence of `UPDATE public.profiles SET role = 'admin'`, `INSERT INTO public.admin_staff_members`.
