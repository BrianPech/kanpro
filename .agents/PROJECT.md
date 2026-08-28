# Project: K'anPro RBAC Security Audit & Architectural Design

## Architecture Overview
- **Application Context**: K'anPro (Next.js 15+ App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, Supabase Auth).
- **Core Problem Statement**: Current authorization architecture is binary (`profiles.role = 'admin'`). The granular administrative model in `public.admin_staff_members` (`sub_role`, `permissions`, `department`, `status`) exists as un-enforced UI metadata, creating multiple P0 Critical vertical and horizontal privilege escalation vectors (Casos A–G).
- **Target Goal**: Formulate an exhaustive, forensic 17-section security audit report and design a robust, defense-in-depth granular RBAC architecture across Database/RLS, Server-side Guards, and Frontend UI without modifying any production code in this phase.

## Feature Inventory & Audit Scope
Every requirement from `ORIGINAL_REQUEST.md` is mapped directly to the report structure:

| # | Feature / Deliverable Section | Description | Target Deliverable | Source |
|---|-------------------------------|-------------|--------------------|--------|
| 1 | Executive Summary | High-level synthesis, risk posture, critical takeaways | Report §1 | ORIGINAL_REQUEST §3.1 |
| 2 | Current Authorization Architecture | End-to-end request flow, auth helpers, client vs service-role contexts | Report §2 | ORIGINAL_REQUEST §3.2 |
| 3 | Roles and Subroles | Detailed taxonomy of `user_role` vs `sub_role` and status flags | Report §3 | ORIGINAL_REQUEST §3.3 |
| 4 | Privilege Inventory | Exhaustive inventory of 52+ Server Actions and admin operations | Report §4 | ORIGINAL_REQUEST §3.4 |
| 5 | Server Action Audit | Guard implementation audit, bypass analysis, parameter risks | Report §5 | ORIGINAL_REQUEST §3.5 |
| 6 | RLS & SQL Function Audit | PL/pgSQL functions (`is_admin`, `get_user_role`), RLS policies on all 16 tables | Report §6 | ORIGINAL_REQUEST §3.6 |
| 7 | Permission System Audit | Functional analysis of `permissions` array (UI illusion vs backend reality) | Report §7 | ORIGINAL_REQUEST §3.7 |
| 8 | Admin -> Super Admin Escalation Analysis | Comprehensive forensic breakdown of Escalation Cases A to G | Report §8 | ORIGINAL_REQUEST §3.8 |
| 9 | Other Findings | Vulnerabilities categorized into P0 Critical, P1 High, P2 Medium, P3 Low, INFO | Report §9 | ORIGINAL_REQUEST §3.9 |
| 10 | Recommended RBAC Architecture | Comparison of Option A (Minimal), Option B (Recommended), Option C (Scalable) | Report §10 | ORIGINAL_REQUEST §3.10 |
| 11 | Security Invariants | Formal definitions of mandatory system invariants (I1 to I8+) | Report §11 | ORIGINAL_REQUEST §3.11 |
| 12 | Proposed Permission Matrix | Granular capability mapping across all subroles and domain resources | Report §12 | ORIGINAL_REQUEST §3.12 |
| 13 | Threat Model | Threat modeling (STRIDE, Threat Actors, Attack Trees, Asset Protection) | Report §13 | ORIGINAL_REQUEST §3.13 |
| 14 | Phased Implementation Plan | Roadmap across Phases 1 to 8 (DB -> Helpers -> Actions -> RLS -> UI -> Tests) | Report §14 | ORIGINAL_REQUEST §3.14 |
| 15 | Proposed RBAC Test Matrix | 16+ adversarial test specifications with attack payloads and expected outcomes | Report §15 | ORIGINAL_REQUEST §3.15 |
| 16 | Migration & Compatibility Risks | Backward compatibility, zero-downtime schema migrations, rollback plans | Report §16 | ORIGINAL_REQUEST §3.16 |
| 17 | Final Recommendation & Conclusion | Strategic architectural verdict and next operational steps | Report §17 | ORIGINAL_REQUEST §3.17 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Survey & Technical Investigation | 3-way multi-angle exploratory audit (Actions, RLS, Escalations) | none | DONE |
| M2 | Report Compilation & Architecture Drafting | Compile the 17-section consolidated report `RBAC_SECURITY_AUDIT_KANPRO.md` | M1 | DONE |
| M3 | Multi-Role Review & Adversarial Verification | Independent Reviewers (x2) & Challengers (x2) evaluate report rigor | M2 | DONE |
| M4 | Forensic Integrity Audit | Forensic Auditor (`teamwork_preview_auditor`) validates zero code changes & fact accuracy | M3 | DONE |
| M5 | Final Gate & Parent Notification | Aggregate all verdicts in `GATE_STATUS.md` and report to Sentinel | M4 | DONE |

## Interface Contracts & Data Models
### Current State
- `public.profiles`: `id UUID PRIMARY KEY`, `role public.user_role ('candidate', 'company', 'admin')`.
- `public.admin_staff_members`: `id UUID PRIMARY KEY`, `profile_id UUID UNIQUE REFERENCES profiles(id)`, `sub_role TEXT`, `department TEXT`, `permissions TEXT[]`, `status TEXT`.
- Current RLS: `is_admin()` evaluates only `profiles.role = 'admin'`.

### Proposed Target Model (Option B - Recommended)
- `public.admin_sub_role`: `ENUM ('super_admin', 'ops_admin', 'content_admin', 'verification_admin', 'support')`.
- `public.admin_permission`: `ENUM ('manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings', 'view_reports', 'manage_support', 'manage_staff')`.
- PostgreSQL RLS: `public.is_admin()`, `public.is_super_admin()`, `public.has_admin_permission(perm_name)`.
- Server Guard: `requireAdminAuth(requiredPermission?: AdminPermission, allowedSubRoles?: AdminSubRole[])`.

## Code Layout & Metadata Convention
- Metadata reports location: `/Users/brianpech/Developer/Commercial/kanpro/.agents/`
- Master audit report: `/Users/brianpech/Developer/Commercial/kanpro/.agents/RBAC_SECURITY_AUDIT_KANPRO.md`
