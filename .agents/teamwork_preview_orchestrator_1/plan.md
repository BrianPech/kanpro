# Execution Plan: K'anPro RBAC Security Audit & Architecture Design

## Phase 0: Survey & Deep Multi-Angle Investigation (Parallel Explorers)
- **Explorer 1 (Server Actions & Auth Guards)**:
  - Inventory 100% of admin Server Actions (`actions/admin-*.ts`, etc.) and internal APIs.
  - Audit guard usage (`requireAdminAuth`, direct profile lookups, auth helpers).
  - Map permissions parameter checks vs raw role checks.
  - Risk categorization (P0 to P3) of every endpoint.
- **Explorer 2 (Database Schema, SQL Functions, RLS Policies & Triggers)**:
  - Audit `public.profiles` (`role`), `public.admin_staff_members` (`sub_role`, `permissions`).
  - Audit SQL functions: `is_admin()`, `get_user_role()`, trigger functions, bypass risks.
  - Audit RLS policies across all tables: which tables have RLS enabled, which allow direct client SDK access to admin data.
  - Inconsistency risks: orphan staff records, admin profile without staff record, etc.
- **Explorer 3 (Admin UI, Escalation Vectors A-G & Permission Semantics)**:
  - Audit Admin frontend UI components, navigation, tabs, action buttons.
  - Examine semantic reality of `permissions`: UI cosmetic gating vs backend enforcement.
  - Analyze Escalation Cases A to G (Admin promoting to super_admin, modifying sub_role/permissions of others or self, deleting super_admin, client SDK tampering).
  - Collect concrete code paths and snippets for escalation vectors.

## Phase 1: Synthesize Findings & Structure Global Scope
- Merge Explorer findings into comprehensive technical tables.
- Establish `PROJECT.md` with full feature inventory, architecture map, and evidence catalog.

## Phase 2: Drafting the 17-Section Consolidated Audit Report (`RBAC Security Audit — K'anPro`)
- Structure:
  1. Executive Summary
  2. Current Authorization Architecture
  3. Roles and Subroles
  4. Privilege Inventory (exhaustive table)
  5. Server Action Audit
  6. RLS & SQL Function Audit (`is_admin`, `get_user_role`, `profiles`, `admin_staff_members`)
  7. Permission System Audit (real semantics vs UI)
  8. Admin -> Super Admin Escalation Analysis (Cases A-G)
  9. Other Findings (P0-P3, INFO)
  10. Recommended RBAC Architecture (Options A, B, C with comparative matrix & recommendation)
  11. Security Invariants (I1-I8+)
  12. Proposed Permission Matrix
  13. Threat Model (STRIDE / Actor-Asset analysis)
  14. Phased Implementation Plan (Fases 1-8)
  15. Proposed RBAC Test Matrix (16+ adversarial test cases)
  16. Migration & Compatibility Risks
  17. Final Recommendation & Conclusion

## Phase 3: Review, Challenge & Forensic Verification
- Reviewers assess completeness, technical depth, and actionable clarity.
- Challengers stress-test escalation cases, edge conditions, and invariant proofs.
- Forensic Auditor checks integrity and ensures 0 code modifications occurred.

## Phase 4: Final Presentation & Delivery
- Validate existing repo tests (`npm test` / vitest) and typecheck pass without modifications.
- Deliver summary and handoff to parent.
