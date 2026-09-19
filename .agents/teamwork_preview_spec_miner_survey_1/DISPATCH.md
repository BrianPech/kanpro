## 2026-08-27T10:42:45Z
Read /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md before starting work.

You are the Admin Actions Spec Miner for the Defense-in-Depth RBAC Hardening implementation for K'anPro.
Your working directory is: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1

Objective:
1. Deeply inspect the entire codebase to locate and catalog all 33 admin server actions (and any other relevant actions in `src/actions/`, `src/app/`, `src/lib/`, etc.).
2. Map out each action with:
   - File path and exported function name
   - Target domain / entity
   - Intended RBAC subrole and specific permissions required (e.g. `super_admin`, `compliance_officer`, `support_lead`, `billing_manager`, `system_auditor`, etc.)
   - Current authentication / authorization checks present in the code
   - Vulnerabilities, missing checks (e.g. missing active status check, missing orphan admin check, missing role authorization, missing PII mask)
3. Document the formal RBAC permissions matrix mapping subroles to exact permissions and server actions.
4. Write your comprehensive report to `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_spec_miner_survey_1/survey_spec_report.md` and deliver `handoff.md` in your working directory. Notify parent with `send_message`.
