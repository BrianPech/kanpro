# Adversarial Challenge Report: RBAC Test Matrix & Defense-in-Depth Verification

**Target Document**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/RBAC_SECURITY_AUDIT_KANPRO.md`  
**Challenger**: Challenger 2 (Test Matrix & Defense Challenger)  
**Date**: August 27, 2026  
**Review Status**: Complete Adversarial Evaluation  
**Verdict**: **APPROVE WITH MANDATORY TEST MATRIX EXPANSION (18 $\to$ 24 Test Cases)**

---

## 1. Executive Summary & Challenge Assessment

The master deliverable `RBAC_SECURITY_AUDIT_KANPRO.md` presents a comprehensive, high-fidelity audit of the K'anPro authorization layer and establishes the **Defense-in-Depth Hybrid RBAC Architecture (Option B)**.

As the Empirical Defense Challenger, this review rigorously stress-tested the **Proposed 18-Case RBAC Test Matrix (Section 15)**, the **10 Security Invariants (Section 11)**, and the **Threat Model (Section 13)** against hostile exploitation scenarios.

### Summary Assessment
1. **Baseline Vector Coverage**: The 18 proposed adversarial tests successfully cover all 9 core attack vectors identified in the audit (Super Admin creation, demotion, self-escalation, horizontal tampering, orphan admin fallback, deactivated staff bypass, PostgREST direct manipulation, commercial subscription tampering, and admin impersonation).
2. **Identified Blindspots & Edge Cases**: 6 subtle but high-impact security failure modes were discovered that require explicit test cases and database-level enforcement:
   - **Blindspot 1**: Last Super Admin Demotion / Lockout (Singleton preservation).
   - **Blindspot 2**: Concurrent Admin Role Updates & TOCTOU Race Conditions.
   - **Blindspot 3**: Session Invalidation & Active JWT Revocation on Status Change (`signOut('global')`).
   - **Blindspot 4**: Foreign Key Cascades & Forensic Audit Log Immutability (`ON DELETE SET NULL`, Append-Only table).
   - **Blindspot 5**: Bidirectional Impersonation Gating (Admin actions blocked during candidate/company impersonation).
   - **Blindspot 6**: Direct Storage Bucket RLS Bypass for Private Documents (`profile_documents` bucket).
3. **Determinism & Zero-Trust Assertions**: Negative tests must enforce two-phase side-effect assertions: verifying both the rejection status (HTTP 403 / Error) and the database state immutability (rollback verification).

---

## 2. Attack Vector Coverage Verification (18 Proposed Tests)

All 9 mandatory attack vectors defined in the security scope were mapped and verified against Section 15:

| Attack Vector | Target Test(s) | Persona / Target | Verification Mechanism | Status |
|---|---|---|---|:---:|
| **1. Super Admin Creation Escalation** | **TS-01, TS-18** | `support` $\to$ `createAdminStaffMember` | Server Action rejects non-super-admin; legitimate super-admin succeeds. | ✅ **VERIFIED** |
| **2. Super Admin Demotion Sabotage** | **TS-03, TS-05** | `ops_admin` / `support` $\to$ `updateAdminStaffMember` / `deleteAdminStaffMember` | Action verifies caller rank > target rank; demotion rejected. | ✅ **VERIFIED** |
| **3. Vertical Self-Escalation** | **TS-04** | `support` $\to$ `updateAdminStaffMember` (self) | Action & DB trigger block self-privilege elevation. | ✅ **VERIFIED** |
| **4. Horizontal Privilege Tampering** | **TS-02, TS-14, TS-15** | `support` $\to$ Peer update, vacancy deactivation, credit adjustment | Granular permission check blocks unassigned capability. | ✅ **VERIFIED** |
| **5. Orphan Admin Fallback** | **TS-08** | Unmapped Admin Profile $\to$ `getAdminStaffMembers` | Resolves to least-privilege `support` (no permissions) instead of auto-escalation. | ✅ **VERIFIED** |
| **6. Deactivated Staff Bypass** | **TS-09, TS-10** | Suspended Admin $\to$ Server Action & PostgREST query | Both application guard and RLS check `status = 'active'`. | ✅ **VERIFIED** |
| **7. PostgREST Direct Manipulation** | **TS-06, TS-07** | `support` / `ops_admin` $\to$ PostgREST `admin_staff_members` & `profiles` | PostgreSQL RLS denies direct mutation via browser SDK. | ✅ **VERIFIED** |
| **8. Commercial Subscription Tampering** | **TS-16** | Company User $\to$ `updateSubscriptionPlan` | Direct mutation blocked; requires HMAC-signed payment webhook. | ✅ **VERIFIED** |
| **9. Admin Impersonation Bypass** | **TS-17** | `support` $\to$ `startImpersonating(super_admin)` | Guard verifies target role $\in \{\text{'candidate'}, \text{'company'}\}$. | ✅ **VERIFIED** |

---

## 3. Adversarial Edge Case & Blindspot Analysis

### Challenge 1: The Last Super Admin Lockout Dilemma (Critical)
- **Assumption Challenged**: System assumes `requireSuperAdmin()` is sufficient to protect administrative hierarchy.
- **Attack Scenario**: A legitimate `super_admin` accidentally or maliciously calls `deleteAdminStaffMember` or `updateAdminStaffMember(subRole: 'support')` on the *only* active Super Admin account in the platform (or Super Admin A demotes Super Admin B while B is the last peer).
- **Blast Radius**: Complete administrative lockout; zero accounts remain capable of creating or promoting staff.
- **Required Defense & Assertion**: Database trigger `trg_prevent_last_super_admin_removal` must assert:
  $$\text{COUNT}(*) \text{ FROM admin\_staff\_members WHERE sub\_role = 'super\_admin' AND status = 'active'} \ge 1$$
- **New Test**: **TS-19**.

---

### Challenge 2: Concurrent Role Updates & TOCTOU Race Conditions (High)
- **Assumption Challenged**: Sequential execution of Server Actions prevents race conditions.
- **Attack Scenario**: Two Super Admins simultaneously attempt to demote each other. Under concurrent execution, both read `count = 2`, both proceed with UPDATE, resulting in `count = 0`.
- **Blast Radius**: Race condition breaks singleton / quorum invariants.
- **Required Defense & Assertion**: Transaction-level row lock (`SELECT 1 FROM admin_staff_members WHERE sub_role = 'super_admin' FOR UPDATE`) or serializable isolation level during staff role mutations.
- **New Test**: **TS-20**.

---

### Challenge 3: Active Session Revocation & JWT Invalidation on Suspension (High)
- **Assumption Challenged**: Updating `admin_staff_members.status = 'suspended'` immediately stops malicious activity.
- **Attack Scenario**: A rogue administrator's access is revoked by management. However, their active browser session holds a valid Supabase Auth JWT token (with up to 1-hour expiration) and Next.js session cookies. If any cached endpoint or client-side route reads the JWT claims without checking the database, the rogue admin continues to operate.
- **Blast Radius**: Suspended rogue admin executes unauthorized reads during the token lifetime window.
- **Required Defense & Assertion**: `toggleAdminStaffStatus(id, 'suspended')` must execute `supabase.auth.admin.signOut(id, 'global')` to invalidate all active refresh tokens and revoke session state.
- **New Test**: **TS-21**.

---

### Challenge 4: Audit Log Immutability & Anti-Repudiation on User Deletion (High)
- **Assumption Challenged**: Deleting a user cleans up all relational data cleanly.
- **Attack Scenario**: A malicious administrator performs unauthorized modifications, and is subsequently deleted from `auth.users`. If `admin_audit_logs.actor_id` or `target_id` uses `ON DELETE CASCADE`, all forensic audit records of the attacker's actions are permanently purged from the database.
- **Blast Radius**: Destruction of evidence; violation of Invariant I10 (Non-Repudiation).
- **Required Defense & Assertion**: `admin_audit_logs` must be an append-only table. Foreign keys must use `ON DELETE SET NULL` with a preserved `actor_email_snapshot` column. RLS policies must strictly forbid `UPDATE` and `DELETE` on `admin_audit_logs` for all roles including `super_admin`.
- **New Test**: **TS-22**.

---

### Challenge 5: Cross-Context Confusion During Active Impersonation (Medium)
- **Assumption Challenged**: Impersonation cookies only affect client display.
- **Attack Scenario**: An administrator initiates impersonation of a candidate. While impersonating, the attacker calls an administrative Server Action (e.g. `deleteAdminStaffMember`). If the guard reads `auth.getUser()` (which returns the admin identity) while the request is in an impersonation context, unintended mutations could occur under confused deputy conditions.
- **Blast Radius**: Unintended administrative actions performed under candidate/company context.
- **Required Defense & Assertion**: Central guard `requireAdminAuth()` must check for active impersonation cookies; if an impersonation cookie is active, admin Server Actions must be blocked until `stopImpersonating()` is invoked.
- **New Test**: **TS-23**.

---

### Challenge 6: Storage Bucket RLS Enforcement for Private Documents (Medium)
- **Assumption Challenged**: Server Actions are the sole vector for accessing private verification documents.
- **Attack Scenario**: A `support` or `content_admin` user directly invokes the Supabase Storage API (`supabase.storage.from('profile_documents').download(...)`) using their browser client token. If storage RLS checks only `public.is_admin()`, unauthorized staff can exfiltrate sensitive candidate documents (INE, CURP certificates, RFC documents).
- **Blast Radius**: Mass PII exfiltration bypassing Server Action guards.
- **Required Defense & Assertion**: Storage RLS policy on `storage.objects` for bucket `'profile_documents'` must evaluate `public.has_admin_permission('verify_documents')`.
- **New Test**: **TS-24**.

---

## 4. Expanded 24-Case RBAC Adversarial Test Matrix

To guarantee 100% zero-trust coverage and address all identified blindspots, the proposed test matrix is expanded from 18 to **24 comprehensive adversarial test cases**:

| Test ID | Target Attack Vector | Actor Persona | Target Resource / Action | Attack Payload / Action | Expected Result | Invariant Verified |
|---|---|---|---|---|---|:---:|
| **TS-01** | Staff Creation Escalation (Case A) | `support` Admin | `createAdminStaffMember` | `{ subRole: 'super_admin', permissions: ALL }` | ❌ **403 Forbidden / Error** (DB unchanged) | I2, I4 |
| **TS-02** | Peer Subrole Elevation (Case B) | `support` Admin | `updateAdminStaffMember` | Target: Peer Admin, `subRole: 'super_admin'` | ❌ **403 Forbidden / Error** (DB unchanged) | I2, I4 |
| **TS-03** | Super Admin Downgrade Sabotage (Case C) | `ops_admin` | `updateAdminStaffMember` | Target: Super Admin, `subRole: 'support'` | ❌ **403 Forbidden / Error** (DB unchanged) | I2 |
| **TS-04** | Self-Escalation to Super Admin (Case D) | `support` Admin | `updateAdminStaffMember` | Target: Self User ID, `subRole: 'super_admin'` | ❌ **403 Forbidden / Error** (DB unchanged) | I3 |
| **TS-05** | Super Admin Lockout / Deletion (Case E) | `support` Admin | `deleteAdminStaffMember` | Target: Super Admin User ID | ❌ **403 Forbidden / Error** (DB unchanged) | I2 |
| **TS-06** | Direct SDK Mutation on Staff Table (Case F) | `support` Admin | PostgREST `admin_staff_members` | `UPDATE admin_staff_members SET sub_role = 'super_admin'` | ❌ **RLS Access Denied (0 rows affected)** | I5 |
| **TS-07** | Direct SDK Mutation on Profiles Role (Case F) | `ops_admin` | PostgREST `profiles` | `UPDATE profiles SET role = 'admin' WHERE id = target` | ❌ **RLS Access Denied (0 rows affected)** | I2, I5 |
| **TS-08** | Orphan Admin Auto-Escalation (Case G) | Unmapped Admin | `getAdminStaffMembers` | Fetch staff list with orphan profile in DB | ✅ **Defaults to 'support' (Least Privilege)** | I1, I9 |
| **TS-09** | Inactive Staff Server Action Access | Suspended Admin | `getSupportTickets` | Call any admin Server Action while `status='suspended'` | ❌ **403 Forbidden / Session Suspended** | I1 |
| **TS-10** | Inactive Staff Direct Database Query | Suspended Admin | PostgREST `support_tickets` | `SELECT * FROM support_tickets` while suspended | ❌ **RLS Access Denied (0 rows / Error)** | I1, I5 |
| **TS-11** | User Promotion via User Actions | `ops_admin` | `updateUserRole` | `{ userId: candidateId, newRole: 'admin' }` | ❌ **403 Forbidden / Super Admin Only** | I2, I4 |
| **TS-12** | Unauthorized Private PII Access | `support` Admin | `getCandidateVerificationById` | Read private identity (CURP/RFC) without permission | ❌ **403 Forbidden / PII Redacted** | I8 |
| **TS-13** | Unauthorized Legal Document Approval | `content_admin`| `reviewCompanyVerification` | Approve fiscal dossier without `verify_documents` | ❌ **403 Forbidden / Error** | I4 |
| **TS-14** | Unauthorized Vacancy Deactivation | `support` Admin | `quickDeactivateVacancy` | Deactivate vacancy without `manage_vacancies` | ❌ **403 Forbidden / Error** | I4 |
| **TS-15** | Unauthorized Company Credit Adjustment | `support` Admin | `adjustCompanyCredits` | Grant $1,000 balance without financial authorization | ❌ **403 Forbidden / Error** | I4, I7 |
| **TS-16** | Commercial Self-Subscription Bypass | Regular Company| `updateSubscriptionPlan` | Direct request `{ plan: 'enterprise' }` | ❌ **403 Forbidden / Signature Required** | I7 |
| **TS-17** | Admin-on-Admin Impersonation | `support` Admin | `startImpersonating` | Target: Super Admin User ID | ❌ **403 Forbidden / Blocked by I6** | I6 |
| **TS-18** | Legitimate Super Admin Staff Operations | `super_admin` | `createAdminStaffMember` | `{ subRole: 'ops_admin', permissions: ['manage_users'] }` | ✅ **200 OK / Staff Created Successfully** | I2 |
| **TS-19** | **Last Super Admin Deletion / Demotion Prevention** | `super_admin` (Solo) | `deleteAdminStaffMember` / `updateAdminStaffMember` | Attempt to delete/demote the last remaining Super Admin | ❌ **400 Bad Request / Singleton Lockout Trigger** | I2 (Singleton) |
| **TS-20** | **Concurrent Demotion Race Condition (TOCTOU)** | 2 $\times$ `super_admin` | `deleteAdminStaffMember` (Concurrent) | Concurrently demoting each other to reach 0 super admins | ❌ **Serialized / 1 Succeeds, 1 Blocked (Quorum $\ge 1$)** | I2, Concurrency |
| **TS-21** | **Immediate Session Revocation on Status Change** | `super_admin` $\to$ Target | `toggleAdminStaffStatus` | Suspend staff member with active JWT session | ✅ **`signOut('global')` invoked, token revoked** | I1, Session |
| **TS-22** | **Audit Log Immutability on User Deletion** | Any Admin / Deleted User| PostgREST `admin_audit_logs` | Attempt `UPDATE` / `DELETE` on audit logs; delete actor | ❌ **RLS Denied (Append-Only); Logs Preserved** | I10 |
| **TS-23** | **Impersonation Session Admin Action Gating** | `super_admin` (Impersonating) | Any Admin Server Action | Execute admin action while impersonating candidate | ❌ **403 Forbidden / Stop Impersonation Required** | I6 |
| **TS-24** | **Storage Bucket Direct RLS Enforcement** | `support` Admin | Supabase Storage `profile_documents` | Direct download / signed URL for candidate private files | ❌ **Storage RLS Denied (Missing verify_documents)** | I5, I8 |

---

## 5. Formal Defense Challenger Verdict

### Verdict: **APPROVE WITH MANDATORY TEST MATRIX ENHANCEMENT**

#### Justification:
1. **Architecture Soundness**: Option B (Defense-in-Depth Hybrid RBAC) is architecturally robust, optimal for the Next.js 16 + Supabase stack, and eliminates the root vulnerabilities identified in the audit.
2. **Acceptance Criteria Fulfillment**: The audit and blueprint fulfill 100% of the requirements defined in `ORIGINAL_REQUEST.md`.
3. **Defense-in-Depth Hardening**: Incorporating the 6 additional edge cases (TS-19 through TS-24) guarantees that concurrency, session lifetimes, storage RLS, audit trail immutability, and singleton preservation are comprehensively verified during implementation.
