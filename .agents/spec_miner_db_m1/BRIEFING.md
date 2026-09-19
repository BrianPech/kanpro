# BRIEFING — 2026-08-26T11:05:30Z

## Mission
Probe, discover, and document all database schema details, triggers on `auth.users`, and table definitions to specify the exact SQL migration statement for hardening `handle_new_user()` and the secure bootstrap procedure for Milestone 1.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Teamwork specialist, Database Schema Spec Miner
- Working directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1
- Original parent: 6cecd5f4-330f-445f-9d8e-dc58c11455a5
- Milestone: Milestone 1 (Survey & Security Audit Assessment - DB Spec Mining)

## 🔒 Key Constraints
- Do NOT implement anything — read-only spec miner. Output files must be written only inside working directory `.agents/spec_miner_db_m1/`.
- Inspect all migration files in `supabase/migrations/` for `handle_new_user()`, schemas, enums, triggers, and foreign keys.
- Preserve legitimate behaviors of `handle_new_user()` (`candidate_profiles`, `candidate_private_profiles`, `company_profiles`, `birth_date`, timestamps, enums, etc.).
- Strict candidate default: metadata role `company` -> `company`; anything else -> `candidate` (NEVER admin).
- ON CONFLICT preservation: existing admin profile must never be degraded or overwritten.
- Document exact bootstrap procedure for first admin without public endpoints.

## Current Parent
- Conversation ID: 6cecd5f4-330f-445f-9d8e-dc58c11455a5
- Updated: 2026-08-26T11:05:30Z

## Task Summary
- **What to build**: Specification report (`analysis.md` and `handoff.md`) with exact schema facts, trigger details, idempotent migration SQL draft, and bootstrap SQL.
- **Success criteria**: Full enumeration of all affected tables, columns, enums, constraints, triggers, exact `handle_new_user()` logic, and bootstrap steps.
- **Interface contracts**: PROJECT.md / ORIGINAL_REQUEST.md
- **Code layout**: Migrations in `supabase/migrations/`

## Loaded Skills
- **supabase**:
  - Source: `/Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase/SKILL.md`
  - Local copy: `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/skills/supabase.md`
  - Core methodology: Supabase Auth, RLS security checklist, search_path security, declarative/imperative migrations.
- **supabase-postgres-best-practices**:
  - Source: `/Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase-postgres-best-practices/SKILL.md`
  - Local copy: `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/skills/supabase-postgres-best-practices.md`
  - Core methodology: Postgres performance, RLS policies, indexing, security definer best practices.

## Key Decisions Made
- All 18 migration files in `supabase/migrations/` inspected.
- Root cause identified in `handle_new_user()` in `20260728000000`, `20260815030000`, and `20260815034500`.
- Auth trigger `on_auth_user_created` verified as single trigger on `auth.users`.
- Authoritative SQL migration statement designed with strict candidate default, `SET search_path = public, pg_temp;`, `ON CONFLICT` admin preservation, and `REVOKE EXECUTE`.
- Operational bootstrap script specified in DO block format with verification query.

## Artifact Index
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/DISPATCH.md` — Dispatch record
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/BRIEFING.md` — Situational awareness
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/progress.md` — Liveness & heartbeat
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/analysis.md` — Detailed technical findings and specification tables
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/spec_miner_db_m1/handoff.md` — 5-Component Handoff report
