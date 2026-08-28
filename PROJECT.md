# Project: Defense-in-Depth RBAC Hardening for K'anPro

## Architecture
Defense-in-Depth multi-layered authorization system across 4 distinct layers:
1. **Routing & Middleware Layer (`src/proxy.ts`, `src/lib/supabase/proxy.ts`, `src/app/(dashboard)/dashboard/admin/layout.tsx`)**: Intercepts unauthorized/suspended users, enforces active admin staff membership, prevents orphan admins from accessing admin dashboards.
2. **Server Action & Backend Layer (`src/lib/auth/rbac-guards.ts`, `src/lib/auth/impersonation.ts`, admin actions, company actions)**: Centralized authorization helpers (`requireAdminStaffAuth`, `requireSuperAdminAuth`, `requireActiveAdmin`), strict permission enforcement across all 33 admin actions, HMAC-SHA256 signed impersonation engine with actor revalidation and admin target prohibition.
3. **Database & RLS Layer (`supabase/migrations/20260827000000_rbac_defense_in_depth.sql`)**: PostgreSQL SECURITY DEFINER functions (`public.is_active_admin`, `public.is_super_admin`, `public.has_admin_permission`), restrictive RLS policies for `admin_staff_members`, `candidate_private_profiles`, `profile_documents`, `company_profiles` BEFORE UPDATE trigger against commercial plan self-escalation, and `prevent_last_super_admin_removal` trigger.
4. **Presentation / UI Layer (`src/modules/admin/components/app-sidebar.tsx`, data tables, modals)**: UI navigation and action controls rendered strictly according to computed staff permissions; graceful 403 handling.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | RBAC Architecture Blueprint | Exhaustive specification document at `docs/security/RBAC_HARDENING_BLUEPRINT.md` | M0 | Survey & ORIGINAL_REQUEST |
| 2 | Centralized RBAC Server Guards | `requireAdminStaffAuth`, `requireSuperAdminAuth`, `requireActiveAdmin` in `src/lib/auth/rbac-guards.ts` | M1 | Survey & ORIGINAL_REQUEST (Paso 1) |
| 3 | Cryptographic HMAC Impersonation Engine | HMAC-SHA256 signed token cookie, actor revalidation, admin target prohibition | M1 | Survey & ORIGINAL_REQUEST (Paso 7) |
| 4 | DB Security Definer Functions | `is_active_admin`, `is_super_admin`, `has_admin_permission`, `prevent_last_super_admin_removal` | M2 | Survey & ORIGINAL_REQUEST (Paso 2) |
| 5 | DB RLS Restructuring | Hardened RLS for `admin_staff_members`, `candidate_private_profiles`, `company_profiles` trigger, `profiles` leak | M2 | Survey & ORIGINAL_REQUEST (Paso 3) |
| 6 | Staff Action Hardening | `staff/actions.ts` super_admin-only checks, no self-escalation, last super_admin protection | M3 | Survey & ORIGINAL_REQUEST (Paso 4) |
| 7 | Suspended Account Enforcement | Revocation of access across proxy, layout guards, Server Actions, and RLS | M3 | Survey & ORIGINAL_REQUEST (Paso 5) |
| 8 | Fail-Closed Orphan Admin Defense | Elimination of default super_admin fallback for unmapped profiles | M3 | Survey & ORIGINAL_REQUEST (Paso 6) |
| 9 | PII Isolation & Verification Guards | Guarding all 8 verification actions with `verify_documents` permission | M4 | Survey & ORIGINAL_REQUEST (Paso 8) |
| 10 | Commercial Billing & Settings Remediation | Ownership validation (`companyId === user.id`) and Enterprise plan protection | M4 | Survey & ORIGINAL_REQUEST (Paso 9) |
| 11 | Remaining Admin Actions Hardening | Hardening users, reports, support, and admin verification actions with specific permissions | M4 | Survey & ORIGINAL_REQUEST |
| 12 | UI & UX Synchronization | Updating `app-sidebar.tsx`, action tables, modals, and 403 error states | M5 | Survey & ORIGINAL_REQUEST (Paso 10) |
| 13 | Adversarial Test Suite (>=33 tests) | Automated adversarial test suite in Vitest testing all 10 pasos and RBAC invariants | M-Test | Survey & ORIGINAL_REQUEST |
| 14 | Final Verification & Security Audit | Full test run (93 pre-existing + 33 new = 126 tests), typecheck, lint, build, and `RBAC_HARDENING_FINAL_AUDIT.md` | M-Final | Survey & ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Phase 0 Blueprint Generation | Create `docs/security/RBAC_HARDENING_BLUEPRINT.md` | None | PLANNED |
| M1 | Server Guards & Impersonation Engine | Implement `src/lib/auth/rbac-guards.ts` and `src/lib/auth/impersonation.ts` | M0 | PLANNED |
| M2 | Database Security Layer & RLS | Create SQL migration with functions, triggers, and RLS policies | M0 | PLANNED |
| M3 | Staff Lifecycle & Fail-Closed Guards | Harden `staff/actions.ts`, proxy, layout, and orphan admin handling | M1, M2 | PLANNED |
| M4 | Domain Actions & PII / Billing Remediation | Harden all admin actions, PII isolation, and company settings | M1, M2 | PLANNED |
| M5 | UI Synchronization & UX Hardening | Sync `app-sidebar.tsx`, modals, data tables, and 403 handling | M3, M4 | PLANNED |
| M-Test | Adversarial Test Suite Track | Implement >=33 adversarial tests in `src/__tests__/security/defense-in-depth-rbac.test.ts` | M1, M2, M3, M4 | PLANNED |
| M-Final | Full Regression & Final Audit Delivery | Run 126 tests, build, lint, typecheck, deliver `RBAC_HARDENING_FINAL_AUDIT.md` | M5, M-Test | PLANNED |

## Interface Contracts
### `src/lib/auth/rbac-guards.ts`
- `export async function requireActiveAdmin(): Promise<{ user: User; profile: Profile; staff: AdminStaffMember }>`
- `export async function requireAdminStaffAuth(permission?: AdminPermissionKey): Promise<{ user: User; profile: Profile; staff: AdminStaffMember }>`
- `export async function requireSuperAdminAuth(): Promise<{ user: User; profile: Profile; staff: AdminStaffMember }>`
- `export function hasPermission(staff: AdminStaffMember, permission: AdminPermissionKey): boolean`

### `src/lib/auth/impersonation.ts`
- `export async function startImpersonating(targetUserId: string): Promise<{ success: boolean; error?: string }>`
- `export async function stopImpersonating(): Promise<{ success: boolean; error?: string }>`
- `export async function getImpersonationState(): Promise<ImpersonationState | null>`
- Cookie: `kanpro_impersonation_token` containing base64 payload and HMAC-SHA256 signature, signed with `IMPERSONATION_SECRET` or fallback derived from `SUPABASE_SERVICE_ROLE_KEY`.

### Database Functions (`supabase/migrations/20260827000000_rbac_defense_in_depth.sql`)
- `public.is_active_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean`
- `public.is_super_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean`
- `public.has_admin_permission(perm text, user_id uuid DEFAULT auth.uid()) RETURNS boolean`
- `public.prevent_last_super_admin_removal() RETURNS trigger`

## Code Layout
- `docs/security/RBAC_HARDENING_BLUEPRINT.md`: Comprehensive RBAC architecture blueprint
- `docs/security/RBAC_HARDENING_FINAL_AUDIT.md`: Final forensic security audit report
- `src/lib/auth/rbac-guards.ts`: Centralized RBAC server action guards
- `src/lib/auth/impersonation.ts`: Hardened HMAC-SHA256 impersonation engine
- `src/lib/auth/require-admin.ts`: Refactored layout/route guard
- `src/lib/supabase/proxy.ts`: Proxy session interceptor with active staff validation
- `supabase/migrations/20260827000000_rbac_defense_in_depth.sql`: PostgreSQL security functions, RLS, and triggers
- `src/app/(dashboard)/dashboard/admin/`: Admin server actions (actions, reports, staff, support, users, verifications)
- `src/modules/company/actions/settings.ts`: Hardened company billing & settings actions
- `src/modules/admin/components/`: Admin UI components (sidebar, data tables, modals)
- `src/__tests__/security/defense-in-depth-rbac.test.ts`: Adversarial test suite
