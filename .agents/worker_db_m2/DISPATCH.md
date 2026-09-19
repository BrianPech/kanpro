## 2026-08-26T11:06:55Z

You are the Database / Supabase Worker for Milestone 2 of the K'anPro Admin Creation Security Hardening project.

Working Directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/worker_db_m2/
All your coordination metadata must be written only inside your working directory.

Mandatory files to read:
1. /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md
2. /Users/brianpech/Developer/Commercial/kanpro/PROJECT.md
3. /Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/analysis.md
4. /Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/handoff.md
5. /Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase/SKILL.md
6. /Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase-postgres-best-practices/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Implement Requirement R1:
   - Create a new idempotent SQL migration file: `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`.
   - DO NOT modify historical migrations (`20260728000000`, `20260815030000`, `20260815034500`, etc.).
   - Follow the exact specification designed by the Spec Miner:
     - `CREATE OR REPLACE FUNCTION public.handle_new_user()`
     - `SECURITY DEFINER` and `SET search_path = public, pg_temp;`
     - Extract `raw_user_meta_data->>'role'`. If `'company'`, assign `'company'::public.user_role`. Otherwise, strictly assign `'candidate'::public.user_role`.
     - `INSERT INTO public.profiles ... ON CONFLICT (id) DO UPDATE SET role = CASE WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role ELSE EXCLUDED.role END, ...` (preserving existing admin role).
     - Maintain candidate profiles creation, birth_date parsing/sync to `candidate_private_profiles`, company profile defaults.
     - `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;`
     - Idempotently recreate trigger `on_auth_user_created` on `auth.users`.
2. Implement Requirement R5:
   - Create `docs/security/ADMIN_BOOTSTRAP.md` detailing the secure operational bootstrap procedure via SQL Editor / Supabase Dashboard.
   - Include clear step-by-step instructions, the complete operational SQL DO block script for provisioning the initial `super_admin`, and the SQL verification query.
3. Write `handoff.md` and `changes.md` in your working directory summarizing your changes, rationale, and verification method.
4. Send a message to orchestrator with your results.
