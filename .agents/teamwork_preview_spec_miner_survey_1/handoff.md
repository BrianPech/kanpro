# Handoff Report — Admin Actions Spec Miner (RBAC Hardening Survey)

**Agent**: `teamwork_preview_spec_miner_survey_1`  
**Parent Agent ID**: `2cc9893f-6efd-44ed-b85b-6f912ce3f931`  
**Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1`  
**Report Artifact**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1/survey_spec_report.md`  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

A complete static inspection and code analysis was performed across all server action modules, auth helpers, route handlers, migrations, and UI components in the K'anPro codebase. The direct observations include:

1. **33 Administrative Server Actions Found Across 6 Core Action Files**:
   - `src/app/(dashboard)/dashboard/admin/actions.ts` (Lines 6–44): 2 actions (`toggleProfileVerification`, `toggleCandidateVerification`).
   - `src/app/(dashboard)/dashboard/admin/reports/actions.ts` (Lines 35–216): 5 actions (`getVacancyReports`, `quickDeactivateVacancy`, `banUserAccount`, `toggleCompanyVerification`, `resolveReport`).
   - `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (Lines 32–354): 5 actions (`getAdminStaffMembers`, `createAdminStaffMember`, `updateAdminStaffMember`, `toggleAdminStaffStatus`, `deleteAdminStaffMember`).
   - `src/app/(dashboard)/dashboard/admin/support/actions.ts` (Lines 44–507): 10 actions (`getSupportTickets`, `getSupportTicketById`, `createSupportTicket`, `getTicketMessages`, `addTicketMessage`, `updateTicketStatus`, `searchUserForSupport`, `sendDirectUserNotification`, `adjustCompanyCredits`, `quickResetUserStatus`).
   - `src/app/(dashboard)/dashboard/admin/users/actions.ts` (Lines 30–144): 4 actions (`updateUserRole`, `toggleUserStatus`, `updateUserProfile`, `getUserProfileDetails`).
   - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts` (Lines 128–601): 8 actions (`getSignedDocumentUrl`, `getCompanyVerifications`, `getCompanyVerificationById`, `getCandidateVerificationById`, `getCandidateVerifications`, `reviewCompanyVerification`, `reviewCandidateVerification`, `reviewProfileDocument`).

2. **Related Privileged & Security-Sensitive Actions**:
   - `src/lib/auth/impersonation.ts` (Lines 18–161): `startImpersonating`, `stopImpersonating`, `getImpersonationState`.
   - `src/modules/company/actions/settings.ts` (Lines 12–155): `toggleGlobalRecruitment`, `updateContactChannel`, `updateSubscriptionPlan`, `getCompanyInvoices`.
   - `src/modules/company/actions/employees.ts` (Lines 9–93): `updateEmployeeStartDate`, `terminateEmployee`, `reactivateEmployee`.
   - `src/modules/company/actions/document-access.ts` (Lines 9–206): `requestDocumentAccess`, `respondDocumentAccessRequest`, `getDocumentAccessStatus`, `getAuthorizedCandidateDocuments`.
   - `src/modules/candidate/services/get-vacancies-by-location.ts` (Lines 6–149): `getVacanciesByLocation`.

3. **Current Guard Implementations Observed in Code**:
   - `requireAdminAuth()` in `reports/actions.ts:11-33`, `staff/actions.ts:8-30`, `support/actions.ts:16-38`, `users/actions.ts:6-28`, `verifications/actions.ts:101-123`:
     ```ts
     const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
     if (!profile || profile.role !== "admin") throw new Error("Acceso denegado...");
     ```
     Verifies ONLY `profiles.role === 'admin'`. Does not verify `admin_staff_members.status`, `sub_role`, or `permissions`.
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63-72`:
     ```ts
     subRole: (s?.sub_role as AdminSubRole) || "super_admin",
     permissions: (s?.permissions as AdminPermissionKey[]) || [
       "manage_users", "manage_companies", "verify_documents",
       "manage_vacancies", "analytics_access", "system_settings",
     ],
     ```
     Defaults orphan admins to `super_admin` with all 6 permissions.

4. **PostgreSQL RLS Implementation Observed**:
   - In `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:1-105`:
     Function `public.is_admin()` checks `profiles.role = 'admin'`. Policies on `admin_staff_members`, `candidate_private_profiles`, `profile_documents`, `company_invoices`, `company_profiles`, `support_tickets`, and `vacancy_reports` grant `FOR ALL TO authenticated USING (public.is_admin())`.

---

## 2. Logic Chain

1. **Premise**: Defense-in-depth requires that no single layer (UI, action, or database) blindly trusts client inputs or collapses distinct subroles into a single root privilege.
2. **Observation**: All 33 admin actions check only `profiles.role === 'admin'`, and all RLS policies for admin tables check only `public.is_admin()`.
3. **Inference**: Any user with `profiles.role = 'admin'` has unrestricted root access in both application code and PostgreSQL RLS, completely bypassing subroles (`support`, `content_admin`, `verification_admin`, `ops_admin`) and permissions.
4. **Observation**: `updateAdminStaffMember` allows modifying any profile's `sub_role` and `permissions` without verifying the caller's subrole or status.
5. **Inference**: Vertical escalation (creating or promoting to `super_admin`), self-elevation, and horizontal hijacking are possible directly from the UI or via Server Action invocations.
6. **Observation**: `getAdminStaffMembers` provides a fallback granting `super_admin` and all permissions to profiles with no `admin_staff_members` record.
7. **Inference**: Orphan admins fail open rather than closed, violating safety invariant I7.
8. **Observation**: `updateSubscriptionPlan` accepts `'enterprise'` and updates `company_profiles` without verifying payment webhooks.
9. **Inference**: A commercial bypass exists allowing free activation of Enterprise plans and featured vacancies.
10. **Conclusion**: The specification report accurately documents all 33 actions, maps out required permissions, defines the formal RBAC matrix, and establishes the blueprints for Step 1 through Step 10 remediation.

---

## 3. Caveats

- **No Code Modifications Made**: Consistent with the read-only audit directive, zero source files, test suites, or SQL migrations were modified or created in production directories.
- **Backwards Compatibility**: `toggleCandidateVerification` in `src/app/(dashboard)/dashboard/admin/actions.ts` is an alias export of `toggleProfileVerification` maintained for test compatibility.
- **Database Triggers**: The trigger `prevent_last_super_admin_removal()` is specified in design but not yet active in PostgreSQL migrations.

---

## 4. Conclusion

All 33 admin server actions and related privileged operations have been comprehensively inventoried and mapped against the formal RBAC permissions matrix. Critical vulnerabilities (vertical escalation, orphan fail-open defaults, inactive admin bypass, PII leaks, unsigned impersonation, commercial plan bypass) have been pinpointed with exact file and line references.

The complete survey report has been generated at:
`/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1/survey_spec_report.md`

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Server Action Inventory**:
   Inspect the 6 admin action files:
   - `src/app/(dashboard)/dashboard/admin/actions.ts`
   - `src/app/(dashboard)/dashboard/admin/reports/actions.ts`
   - `src/app/(dashboard)/dashboard/admin/staff/actions.ts`
   - `src/app/(dashboard)/dashboard/admin/support/actions.ts`
   - `src/app/(dashboard)/dashboard/admin/users/actions.ts`
   - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts`

2. **Verify Orphan Default Bug**:
   Inspect `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63-72` to confirm fallback to `super_admin` and all permissions.

3. **Verify Impersonation Flaws**:
   Inspect `src/lib/auth/impersonation.ts:90-96` to confirm un-signed cookies and lack of `admin` target restriction.

4. **Verify Commercial Plan Bypass**:
   Inspect `src/modules/company/actions/settings.ts:74-133` to confirm unvalidated Enterprise upgrade.

5. **Verify Survey Report Artifact**:
   Read `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1/survey_spec_report.md`.
