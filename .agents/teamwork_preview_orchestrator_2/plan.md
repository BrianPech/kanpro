# AUDIT EXECUTION PLAN: K'anPro RBAC Post-Hardening

## Objectives
Produce an authoritative, deeply technical, and empirical read-only security audit report for K'anPro's post-hardening RBAC architecture, addressing all 5 core requirements (R1–R5) in `docs/security/RBAC_POST_HARDENING_AUDIT.md`.

## Streams and Decomposition

### Stream 1: Authorization Inventory, E2E Flows, Auth Helpers & Impersonation (R1, R2, R4)
- Map Server Actions, Route Handlers, middleware/proxy, layouts, auth helpers (`requireAdminAuth`, `requireAdmin`, `getAdminSession`, `getServerSession`, etc.).
- Audit `lib/auth/impersonation.ts` (HMAC verification, secret entropy, replay attacks, target validation, privileged target prevention).
- Analyze authorization decision matrices and service layer bypass risks.

### Stream 2: Admin Staff Management, Lockout, Privilege Escalation & Commercial Bypass (R3, R4)
- Audit `updateAdminStaffMember`, `createAdminStaffMember`, `deleteAdminStaffMember`, `toggleAdminStaffStatus`.
- Evaluate privilege escalation vectors: can an admin promote themselves/others to super_admin or change their own role/status?
- Evaluate last super_admin lockout protections and atomic concurrency handling.
- Audit subscription upgrade/downgrade Server Actions (`updateSubscriptionPlan`, Stripe webhook sync) for commercial bypass.

### Stream 3: Database & RLS Deep Dive, PII, and Split-Brain Analysis (R4)
- Inventory all tables and check RLS enablement (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- Audit RLS policies across all migrations (especially recent hardening migrations).
- Check `candidate_private_profiles` (CURP, RFC, Cedula, bank details) for unauthorized exposure to company users or standard admins.
- Detect "split-brain" discrepancies between database RLS policies (e.g. `auth.jwt() -> role`) vs application-level role checks (`profiles.role`).

### Stream 4: Forensic Re-evaluation of Findings F-01 to F-22 & 12 Adversarial Scenarios A-L (R5)
- Re-assess historical findings F-01 through F-22 (confirm if FIXED, PARTIALLY FIXED, CONFIRMED, or FALSE POSITIVE).
- Analyze 12 adversarial attack scenarios (A through L) with step-by-step exploit paths, preconditions, code references, and outcomes.
- Determine overarching security posture and residual risk rating.

### Stream 5: Report Synthesis & Authoring
- Worker creates complete 16-section document at `docs/security/RBAC_POST_HARDENING_AUDIT.md`.
- Reviewer & Forensic Auditor verify accuracy, citations, and complete requirement coverage.
