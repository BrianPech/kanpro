## 2026-08-27T10:48:00Z
<USER_REQUEST>
Read /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md before starting work.
Also read:
- /Users/brianpech/Developer/Commercial/kanpro/PROJECT.md
- /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1/survey_spec_report.md
- /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_2/survey_auth_report.md
- /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_3/survey_db_test_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the RBAC Blueprint Author for Milestone 0 (Phase 0).
Your working directory is: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_worker_m0

Task:
Generate the exhaustive RBAC architecture blueprint at:
`/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md`

Requirements for the Blueprint:
1. Executive Summary & Core Security Principles (Defense-in-Depth, Principle of Least Privilege, Fail-Closed Security, Non-Repudiation, Separation of Duties).
2. Complete Catalog & Inventory of all 33 Admin Server Actions across all 6 admin modules + impersonation + company settings.
3. Subroles Definition & Formal Permissions Matrix (Mapping `super_admin`, `compliance_officer`, `support_lead`, `billing_manager`, `system_auditor`, etc., to granular permissions like `manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`).
4. 4-Layer Authorization Model (Routing/Proxy Layer, Server Action/Backend Layer, Database/RLS Layer, Presentation/UI Layer).
5. Comprehensive STRIDE Threat Model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) mapped to specific mitigations.
6. Fail-Closed Rules & Invariant Catalog (I1 to I10, orphan handling, inactive/suspended enforcement, last super admin preservation).
7. Impersonation Engine Specification (HMAC-SHA256 token structure, secret management, actor revalidation, admin target prohibition, audit logging).
8. Staff Lifecycle State Machine (active, suspended, deleted, self-escalation prevention, last super admin removal prevention).
9. Prioritization Roadmap (P0, P1, P2, P3) mapped to the 10 implementation steps.
10. Adversarial Test Plan Specification (minimum 33 test cases mapped to the RBAC matrix and STRIDE threats).

Deliver `docs/security/RBAC_HARDENING_BLUEPRINT.md` and write your completion handoff in `handoff.md` in your working directory. Notify parent via `send_message`.
</USER_REQUEST>
