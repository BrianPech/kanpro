## 2026-08-27T10:07:44Z

You are the Lead Auth Infrastructure & Server Actions/Route Handlers Security Explorer for K'anPro RBAC post-hardening audit.

Working Directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s1
Project Workspace: /Users/brianpech/Developer/Commercial/kanpro
Original Request Path: /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md (Check section ## 2026-08-27T10:05:55Z)

STRICT CONSTRAINT: READ-ONLY on codebase. Do not edit source files. Write your findings to `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s1/report.md`.

YOUR MISSION:
1. Complete Authorization Inventory & E2E Flow Mapping (R1):
   - Inspect all Route Handlers (`app/api/**/*`), Server Actions (`actions/**/*`), proxy/middleware (`middleware.ts`, `proxy.ts`), layout guards (`app/**/layout.tsx`), and auth helpers (`lib/auth/**/*`, `requireAdminAuth`, `requireAdmin`, `getAdminSession`, `getServerSession`, `createClient`, etc.).
   - Create a complete inventory matrix classifying every endpoint/action by authentication requirement (Public, Authenticated, Candidate, Company Member/Owner, Admin, Super Admin).
   - Document the complete end-to-end authorization flow from client request -> middleware/proxy -> layout -> page/action/route -> auth helper -> database/service.

2. Empirical Verification of the Central Finding (R2):
   Empirically answer the 10 Critical Questions with PASS/FAIL, file paths, line numbers, exact mechanism, and blast radius:
   Q1: Can a standard `admin` (`profiles.role = 'admin'`) access all endpoints, actions, and data that a `super_admin` can?
   Q2: Where in the codebase is `super_admin` explicitly differentiated from `admin`?
   Q3: Does the layout/page guard (`app/(admin)/layout.tsx` or similar) differentiate between admin tiers, or only check `role === 'admin' || role === 'super_admin'`?
   Q4: Do API routes under `/api/admin/*` enforce granular permissions or blanket admin checks?
   Q5: Do Server Actions under `actions/admin/*` enforce granular permissions or blanket admin checks?
   Q6: Is `profiles.role = 'admin'` able to access cross-tenant company data?
   Q7: Is `profiles.role = 'admin'` able to access candidate PII without restriction?
   Q8: Does the database layer (RLS) treat `admin` and `super_admin` identically?
   Q9: Are there hardcoded role checks that bypass the permission system?
   Q10: What is the exact blast radius if a standard `admin` account is compromised?

3. Impersonation Audit (R4):
   - Deeply inspect `lib/auth/impersonation.ts` and any consumers.
   - HMAC verification: algorithm, secret key source & entropy, signature validation timing-safe check.
   - Replay attacks: timestamp expiry window, nonce / single-use token tracking.
   - Target validation: can an admin impersonate another admin or a `super_admin`? Can an admin impersonate users across tenants?
   - Session lifecycle: cookie storage, audit logging, termination, and privilege inheritance.

Produce a comprehensive, rigorous report at `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s1/report.md`, then send a message back with your executive summary and key findings.
