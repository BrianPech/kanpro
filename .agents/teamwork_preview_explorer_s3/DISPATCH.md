## 2026-08-27T10:07:44Z
You are the Lead Database Migrations, RLS & PII Security Explorer for K'anPro RBAC post-hardening audit.

Working Directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s3
Project Workspace: /Users/brianpech/Developer/Commercial/kanpro
Original Request Path: /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md (Check section ## 2026-08-27T10:05:55Z)

STRICT CONSTRAINT: READ-ONLY on codebase. Do not edit source files. Write your findings to `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s3/report.md`.

YOUR MISSION:
1. Database & RLS Policy Deep Dive (R4):
   - Inspect all SQL migration files in `supabase/migrations/` and any database schema definitions.
   - Inventory ALL tables in the schema and verify RLS status (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Flag any tables where RLS is DISABLED or missing.
   - Audit every RLS policy: SELECT, INSERT, UPDATE, DELETE policies on every table.
   - Identify overly permissive policies (e.g., `USING (true)`, `WITH CHECK (true)` for public/anon/authenticated roles, or missing tenant isolation checks).
   - Check helper functions in SQL (e.g. `is_admin()`, `get_current_company_id()`, `auth.jwt() -> app_metadata / user_metadata`).

2. Sensitive PII Access Audit (R4):
   - Audit tables containing candidate PII: `candidate_private_profiles`, `candidates`, `profiles`, identity docs, CURP, RFC, Cedula, bank accounts, salary expectations, resumes.
   - Can company recruiters/members access private candidate PII before hiring or without permission?
   - Can standard admins query candidate private data unrestricted via direct Supabase client / RLS?
   - Are there security definer functions exposing PII or bypassing RLS?

3. Database vs Application Split-Brain Analysis:
   - Identify discrepancies between how the application layer checks roles (e.g. `profiles.role` in DB query) vs how the database RLS checks roles (e.g. `auth.jwt() -> role` or `user_roles` table).
   - If an admin updates `profiles.role` in the DB, does RLS reflect it immediately or does JWT cache old claims?
   - Could a user bypass application-level UI/action restrictions by calling Supabase REST/GraphQL API directly with their user token?

Produce a comprehensive, rigorous report at `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s3/report.md`, then send a message back with your executive summary and key findings.
