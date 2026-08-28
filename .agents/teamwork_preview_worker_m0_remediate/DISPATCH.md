# Dispatch Log

## 2026-08-27T10:54:25Z

Read /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md before starting work.
Also read:
- /Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md
- /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_challenger_m0_1/handoff.md
- /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_challenger_m0_2/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the Blueprint Remediation Worker for Milestone 0.
Your working directory is: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_worker_m0_remediate

Task:
Update `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md` to version 1.1 incorporating the 6 required hardening amendments:
1. Dual-trigger architecture for Invariant I3:
   - `trg_prevent_last_super_admin_removal` on `admin_staff_members` (BEFORE UPDATE OR DELETE)
   - `trg_prevent_last_super_admin_profile_demotion` on `profiles` (BEFORE UPDATE OF role OR DELETE)
   - Add row-locking (`PERFORM 1 FROM public.admin_staff_members WHERE sub_role = 'super_admin' AND status = 'active' FOR UPDATE;`) to serialize concurrent demotions.
2. Service-Role Webhook Handling for commercial trigger `protect_company_commercial_fields()`:
   - Condition: `IF (auth.uid() IS NOT NULL) AND (NOT public.is_super_admin(auth.uid())) THEN ...` so background service_role/webhooks are not blocked.
3. Impersonation Continuous Revalidation (Section 7.3 Step 4):
   - Add target role revalidation query asserting `targetProfile.role !== 'admin'` in database at request time.
4. HMAC Token Format & Encoding:
   - Standardize signing over `Base64Url(JSON(Payload))` (UTF-8 bytes).
5. Catalog Action Parameter Sync:
   - Align `toggleCompanyVerification` signature to `(companyId: string, isVerified: boolean)` and `toggleProfileVerification` to `(profileId: string, isValidated: boolean)`.
6. Explicit PostgreSQL Grants on SECURITY DEFINER functions for `authenticated` and `service_role`.

Deliver the updated `docs/security/RBAC_HARDENING_BLUEPRINT.md` and write your handoff in `handoff.md` in your working directory. Notify parent via `send_message`.
